import 'meteor/dburles:collection-helpers';
import { Locale } from 'locale';
import { findLocalizedText } from 'meteor/unchained:core';
import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import { FilterTypes } from './schema';
import { Filters, FilterTexts } from './collections';
import { FilterDirector } from '../director';

const parseQueryArray = query =>
  (query || []).reduce(
    (accumulator, { key, value }) => ({
      ...accumulator,
      [key]: accumulator[key] ? accumulator[key].concat(value) : [value]
    }),
    {}
  );

const intersectProductIds = ({
  productIds,
  filters,
  queryObject,
  ...options
}) =>
  filters.reduce((productIdSet, filter) => {
    const values = queryObject[filter.key];
    return filter.intersect({ values, productIdSet, ...options });
  }, new Set(productIds));

Filters.createFilter = ({ locale, title, type, key, options, ...rest }) => {
  const filter = {
    created: new Date(),
    type: FilterTypes[type],
    key,
    options,
    ...rest
  };
  const filterId = Filters.insert(filter);
  const filterObject = Filters.findOne({ _id: filterId });
  filterObject.upsertLocalizedText(locale, { filterOptionValue: null, title });
  return filterObject;
};

Filters.updateFilter = ({ filterId, ...filter }) => {
  const modifier = {
    $set: {
      ...filter,
      updated: new Date()
    }
  };
  Filters.update({ _id: filterId }, modifier);
  return Filters.findOne({ _id: filterId });
};

Filters.getLocalizedTexts = (filterId, filterOptionValue, locale) =>
  findLocalizedText(
    FilterTexts,
    {
      filterId,
      filterOptionValue: filterOptionValue || { $eq: null }
    },
    locale
  );

Filters.sync = syncFn => {
  const referenceDate = Filters.markFiltersDirty();
  syncFn(referenceDate);
  Filters.cleanFiltersByReferenceDate(referenceDate);
  Filters.updateCleanFilterActivation();
  Filters.wipeFilters();
};

Filters.markFiltersDirty = () => {
  const dirtyModifier = { $set: { dirty: true } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedFiltersCount = Filters.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const updatedFilterTextsCount = FilterTexts.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const timestamp = new Date();
  console.log(`Filter Sync: Marked Filters dirty at timestamp ${timestamp}`, { // eslint-disable-line
    updatedFiltersCount,
    updatedFilterTextsCount
  });
  return new Date();
};

Filters.cleanFiltersByReferenceDate = referenceDate => {
  const selector = {
    dirty: true,
    $or: [
      {
        updated: { $gte: referenceDate }
      },
      {
        created: { $gte: referenceDate }
      }
    ]
  };
  const modifier = { $set: { dirty: false } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedFiltersCount = Filters.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  const updatedFilterTextsCount = FilterTexts.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  console.log(`Filter Sync: Result of filter cleaning with referenceDate=${referenceDate}`, { // eslint-disable-line
      updatedFiltersCount,
      updatedFilterTextsCount
    }
  );
};

Filters.updateCleanFilterActivation = () => {
  const disabledDirtyFiltersCount = Filters.update(
    {
      isActive: true,
      dirty: true
    },
    {
      $set: { isActive: false }
    },
    { bypassCollection2: true, multi: true }
  );
  const enabledCleanFiltersCount = Filters.update(
    {
      isActive: false,
      dirty: { $ne: true }
    },
    {
      $set: { isActive: true }
    },
    { bypassCollection2: true, multi: true }
  );

  console.log(`Filter Sync: Result of filter activation`, { // eslint-disable-line
    disabledDirtyFiltersCount,
    enabledCleanFiltersCount
  });
};

Filters.wipeFilters = (onlyDirty = true) => {
  const selector = onlyDirty ? { dirty: true } : {};
  const removedFilterCount = Filters.remove(selector);
  const removedFilterTextCount = FilterTexts.remove(selector);
  console.log(`result of filter purging with onlyDirty=${onlyDirty}`, { // eslint-disable-line
    removedFilterCount,
    removedFilterTextCount
  });
};

Filters.filterProductIds = ({
  productIds,
  query,
  forceLiveCollection = false
}) => {
  if (!query || query.length === 0) return productIds;
  const queryObject = parseQueryArray(query);

  const filters = Filters.find({
    key: { $in: Object.keys(queryObject) }
  }).fetch();

  const intersectedProductIds = intersectProductIds({
    productIds,
    filters,
    queryObject,
    forceLiveCollection
  });

  return [...intersectedProductIds];
};

Filters.invalidateFilterCaches = () => {
  log('Filters: Invalidating filter caches...');
  Filters.find()
    .fetch()
    .forEach(filter => filter.invalidateProductIdCache());
  log('Filters: Invalidated the filter caches');
};

Filters.filterFilters = ({
  filterIds,
  productIds,
  query,
  forceLiveCollection = false,
  includeInactive = false
} = {}) => {
  const allProductIdsSet = new Set(productIds);
  const queryObject = parseQueryArray(query);
  const selector = { _id: { $in: filterIds } };
  if (!includeInactive) {
    selector.isActive = true;
  }
  const filters = Filters.find(selector).fetch();

  return filters.map(filter => {
    const values = queryObject[filter.key];

    // The examinedProductIdSet is a set of product id's that:
    // - Fit this filter generally
    // - Are part of the preselected product id array
    const examinedProductIdSet = filter.intersect({
      values: [undefined],
      forceLiveCollection,
      productIdSet: allProductIdsSet
    });

    // The filteredProductIdSet is a set of product id's that:
    // - Are filtered by all other filters
    // - Are filtered by the currently selected value of this filter
    // or if there is no currently selected value:
    // - Is the same like examinedProductIdSet
    const queryWithoutOwnFilter = { ...queryObject };
    delete queryWithoutOwnFilter[filter.key];
    const filteredByOtherFiltersSet = intersectProductIds({
      productIds: examinedProductIdSet,
      filters: filters.filter(otherFilter => otherFilter.key !== filter.key),
      queryObject: queryWithoutOwnFilter,
      forceLiveCollection
    });
    const filteredProductIdSet = filter.intersect({
      values: values || [undefined],
      forceLiveCollection,
      productIdSet: filteredByOtherFiltersSet
    });

    return {
      definition: filter,
      examinedProducts: examinedProductIdSet.size,
      filteredProducts: filteredProductIdSet.size, // TODO: Implement
      isSelected: Object.prototype.hasOwnProperty.call(queryObject, filter.key),
      options: () => {
        // The current base for options should be an array of product id's that:
        // - Are part of the preselected product id array
        // - Fit this filter generally
        // - Are filtered by all other filters
        // - Are not filtered by the currently selected value of this filter
        return filter.filteredOptions({
          values,
          forceLiveCollection,
          productIdSet: filteredByOtherFiltersSet
        });
      }
    };
  });
};

Filters.helpers({
  upsertLocalizedText(locale, { filterOptionValue, ...fields }) {
    const selector = {
      filterId: this._id,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale
    };
    FilterTexts.upsert(
      selector,
      {
        $set: {
          updated: new Date(),
          locale,
          ...fields,
          filterOptionValue: filterOptionValue || null
        }
      },
      { bypassCollection2: true }
    );
    return FilterTexts.findOne(selector);
  },
  getLocalizedTexts(locale, optionValue) {
    const parsedLocale = new Locale(locale);
    return Filters.getLocalizedTexts(this._id, optionValue, parsedLocale);
  },
  optionObject(filterOption) {
    return {
      filterOption,
      getLocalizedTexts: this.getLocalizedTexts,
      ...this
    };
  },

  collectProductIds({ value } = {}) {
    const director = new FilterDirector({ filter: this });
    const selector = director.buildProductSelector({
      key: this.key,
      value,
      defaultSelector: {
        status: ProductStatus.ACTIVE
      }
    });
    if (!selector) return [];
    const products = Products.find(selector, { fields: { _id: true } }).fetch();
    return products.map(({ _id }) => _id);
  },
  buildProductIdMap() {
    const cache = {
      allProductIds: this.collectProductIds()
    };
    if (this.type === FilterTypes.SWITCH) {
      cache.productIds = {
        true: this.collectProductIds({ value: true }),
        false: this.collectProductIds({ value: false })
      };
    } else {
      cache.productIds = (this.options || []).reduce(
        (accumulator, option) => ({
          ...accumulator,
          [option]: this.collectProductIds({ value: option })
        }),
        {}
      );
    }

    return cache;
  },
  invalidateProductIdCache() {
    log(`Filters: Rebuilding ${this.key}`); // eslint-disable.line
    const { productIds, ...productIdMap } = this.buildProductIdMap();
    Filters.update(
      { _id: this._id },
      {
        $set: {
          _cache: {
            ...productIdMap,
            productIds: Object.entries(productIds)
          }
        }
      }
    );
  },
  cache() {
    if (!this._cache) return null; // eslint-disable-line
    if (!this._isCacheTransformed) { // eslint-disable-line
      this._cache = { // eslint-disable-line
        allProductIds: this._cache.allProductIds, // eslint-disable-line
        productIds: this._cache.productIds.reduce((accumulator, [key, value]) => ({ // eslint-disable-line
            ...accumulator,
            [key]: value
          }),
          {}
        )
      };
      this._isCacheTransformed = true; // eslint-disable-line
    }
    return this._cache; // eslint-disable-line
  },
  productIds({ values, forceLiveCollection }) {
    const { productIds, allProductIds } = forceLiveCollection
      ? this.buildProductIdMap()
      : this.cache() || this.buildProductIdMap();

    if (this.type === FilterTypes.SWITCH) {
      const [stringifiedBoolean] = values;
      if (stringifiedBoolean !== undefined) {
        if (
          !stringifiedBoolean ||
          stringifiedBoolean === 'false' ||
          stringifiedBoolean === '0'
        ) {
          return productIds.false;
        }
        return productIds.true;
      }
      return allProductIds;
    }

    const reducedValues = values.reduce((accumulator, value) => {
      const additionalValues =
        value === undefined ? allProductIds : productIds[value];
      return [...accumulator, ...(additionalValues || [])];
    }, []);
    return reducedValues;
  },
  intersect({ values, forceLiveCollection, productIdSet }) {
    if (!values) return productIdSet;
    const filterOptionProductIds = this.productIds({
      values,
      forceLiveCollection
    });
    return new Set(filterOptionProductIds.filter(x => productIdSet.has(x)));
  },
  optionsForFilterType(type) {
    if (type === FilterTypes.SWITCH) return ['true', 'false'];
    return this.options || [];
  },
  filteredOptions({ values, forceLiveCollection, productIdSet }) {
    const mappedOptions = this.optionsForFilterType(this.type)
      .map(value => {
        const filteredProductIds = this.intersect({
          values: [value],
          forceLiveCollection,
          productIdSet
        });
        if (!filteredProductIds.size) return null;
        return {
          definition: () => this.optionObject(value),
          filteredProducts: filteredProductIds.size,
          isSelected: values ? values.indexOf(value) !== -1 : false
        };
      })
      .filter(Boolean);
    return mappedOptions;
  }
});
