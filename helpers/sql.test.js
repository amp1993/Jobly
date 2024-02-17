const { sqlForPartialUpdate } = require('./sql.js');

describe("Generates SQL for Partial Updates", function(){
    const data = {
        name: '',
        lastName: '',
        age: ''
    };
    const dataToUpdate = {
        name: 'test',
        lastName: 'user',
        age: 31
    };
    
    test("Returns SQL set clause and parameter values", function(){
        let res = sqlForPartialUpdate(dataToUpdate, data);
        
        expect(res).toEqual({
            setCols: '"name"=$1, "lastName"=$2, "age"=$3',
            values: ['test', 'user', 31]
        });
    });
});
