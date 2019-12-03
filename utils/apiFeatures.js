class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Feature 1: filtering
  filter() {
    const queryObj = { ...this.queryString };
    // exclude the parameters reserved for other features
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    // advanced filtering with operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    // chain on the query
    return this;
  }

  // Feature 2: sorting
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // by default sort by the most recent tours first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // Feature 3: limit the fields in the results to the one selected
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // by default remove __v that we don't need
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // Feature 4: paginate the results
  paginate() {
    // multiply by 1 to convert to a Number (trick), by default page 1 and 100 results
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
