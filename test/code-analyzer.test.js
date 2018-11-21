import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {makeArray} from '../src/js/code-analyzer';

// describe('The javascript parser', () => {
//     it('is parsing an empty function correctly', () => {
//         assert.equal(
//             JSON.stringify(parseCode('')),
//             '{"type":"Program","body":[],"sourceType":"script"}'
//         );
//     });
//
//     it('is parsing a simple variable declaration correctly', () => {
//         assert.equal(
//             JSON.stringify(parseCode('let a = 1;')),
//             '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
//         );
//     });
// });

describe('The javascript parser', () => {
    it('handels function declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('function some(){};')))),
            '[{"Line":1,"Type":"function declaration","Name":"some","Condition":"","Value":""}]'
        );
    });
    it('handels if declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('if (a==0){}')))),
            '[{"Line":1,"Type":"if statement","Name":"","Condition":"a == 0","Value":""}]'
        );
    });
    it('handels while declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('while(a>=0){}')))),
            '[{"Line":1,"Type":"while statement","Name":"","Condition":"a >= 0","Value":""}]'
        );
    });
    it('handels for declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('for(let a=1;a<8;a++){}')))),
            '[{"Line":1,"Type":"for statement","Name":"","Condition":"a=1;a < 8;a++","Value":""}]'
        );
    });
    it('handels Assignment Expression declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('a=a+1;')))),
            '[{"Line":1,"Type":"assignment expression","Name":"a","Condition":" ","Value":"a + 1"}]'
        );
    });
    it('handels Update Expression declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('a++;')))),
            '[{"Line":1,"Type":"update expression","Name":"a","Condition":" ","Value":"a++"}]'
        );
    });
    it('handels if else statement declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('if (a==0)\n' +
                'x++;\n' +
                'else\n' +
                'x--;')))),
            '[{"Line":1,"Type":"if statement","Name":"","Condition":"a == 0","Value":""},{"Line":2,' +
            '"Type":"update expression","Name":"x","Condition":" ","Value":"x++"},' +
            '{"Line":4,"Type":"else statement","Name":"","Condition":" ","Value":""},' +
            '{"Line":4,"Type":"update expression","Name":"x","Condition":" ","Value":"x--"}]'
        );
    });
    it('handels function with parameters declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('function some (x,c){}')))),
            '[{"Line":1,"Type":"function declaration","Name":"some","Condition":"","Value":""},' +
            '{"Line":1,"Type":"variable declaration","Name":"x","Condition":"","Value":""},' +
            '{"Line":1,"Type":"variable declaration","Name":"c","Condition":"","Value":""}]'
        );
    });

    it('handels if with member with parameters declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('if (X < V[mid])\n' +
                '        high = mid - 1;')))),
            '[{"Line":1,"Type":"if statement","Name":"","Condition":"X < V[mid]","Value":""},' +
            '{"Line":2,"Type":"assignment expression","Name":"high","Condition":" ","Value":"mid - 1"}]'
        );
    });
    it('handels return statement', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('function some (){\n' +
                'return true;}')))),
            '[{"Line":1,"Type":"function declaration","Name":"some","Condition":"","Value":""},' +
            '{"Line":2,"Type":"return statement","Name":"","Condition":"","Value":true}]'
        );
    });
    it('handels unary expression', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('function some (){\n' +
                'return -1;}')))),
            '[{"Line":1,"Type":"function declaration","Name":"some","Condition":"","Value":""},' +
            '{"Line":2,"Type":"return statement","Name":"","Condition":"","Value":"- 1"}]'
        );
    });
    it('handels if else if expression', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('function some (){ \n' +
                'if (a==1)\n' +
                'return 1;\n' +
                'else if(a==2)\n' +
                'return 0;\n' +
                'else\n' +
                'return 2;}')))),
            '[{"Line":1,"Type":"function declaration","Name":"some","Condition":"","Value":""}' +
            ',{"Line":2,"Type":"if statement","Name":"","Condition":"a == 1","Value":""}' +
            ',{"Line":3,"Type":"return statement","Name":"","Condition":"","Value":1},' +
            '{"Line":4,"Type":"else if statement","Name":"","Condition":"a == 2","Value":""}' +
            ',{"Line":5,"Type":"return statement","Name":"","Condition":"","Value":0},' +
            '{"Line":7,"Type":"else statement","Name":"","Condition":" ","Value":""},' +
            '{"Line":7,"Type":"return statement","Name":"","Condition":"","Value":2}]'
        );
    });
    it('handels if with block statement', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('function some (){ \n' +
                'if (a==1)\n' +
                '{\n' +
                'x++;\n' +
                'x=x+2;\n' +
                '}}')))),
            '[{"Line":1,"Type":"function declaration","Name":"some","Condition":"","Value":""},' +
            '{"Line":2,"Type":"if statement","Name":"","Condition":"a == 1","Value":""},' +
            '{"Line":4,"Type":"update expression","Name":"x","Condition":" ","Value":"x++"},' +
            '{"Line":5,"Type":"assignment expression","Name":"x","Condition":" ","Value":"x + 2"}]'
        );
    });
    it('handels variable declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('let a=0;')))),
            '[{"Line":1,"Type":"variable declaration","Name":"a","Condition":"","Value":0}]'
        );
    });
    it('handels binary complex declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('let a=(x+7)/(x-10);')))),
            '[{"Line":1,"Type":"variable declaration","Name":"a","Condition":"","Value":"(x + 7) / (x - 10)"}]'
        );
    });
    it('handels else with block statement', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('if (a==0)\n' +
                'x++;\n' +
                'else{\n' +
                'x=x+1;\n' +
                'y=-1+-1;\n' +
                '}')))),
            '[{"Line":1,"Type":"if statement","Name":"","Condition":"a == 0","Value":""},' +
            '{"Line":2,"Type":"update expression","Name":"x","Condition":" ","Value":"x++"},' +
            '{"Line":3,"Type":"else statement","Name":"","Condition":" ","Value":""},' +
            '{"Line":4,"Type":"assignment expression","Name":"x","Condition":" ","Value":"x + 1"},' +
            '{"Line":5,"Type":"assignment expression","Name":"y","Condition":" ","Value":"- 1 + - 1"}]'
        );
    });
    it('handels binary complex declaration', () => {
        assert.equal(
            JSON.stringify((makeArray(parseCode('let a=d[8];')))),
            '[{"Line":1,"Type":"variable declaration","Name":"a","Condition":"","Value":"d[8]"}]'
        );
    });

});
