const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * `sqlForPartialUpdate` function is designed to dynamically generate SQL for partial updates based on the data provided and a mapping of JavaScript to SQL column names.
 *
 * dataToUpdate - The object containing the data to be updated.
 * jsToSql - A mapping of JavaScript object keys to corresponding SQL column names.
 * BadRequestError Throws a bad request error if there is no data to update.
 * Returns an object containing the SQL SET clause and parameter values for the update query.
 */


function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
