import assert from 'assert';
import {parseCode, tableInfo, makeArray} from '../src/js/code-analyzer';
import {startSubstitution,newLines} from '../src/js/symbolicSubstitution';


describe('Substitution Checks',()=>{

    it('function with return statement', ()=>{
        let text=parseCode('function foo() {\n' +
            '    return 0;\n' +
            '}');
        makeArray(text);
        let expRes=[{Line:'1', Type:'function declaration', Name:'foo', Condition:'', Value:''},
            {Line:'2', Type:'return statement', Name:'', Condition:'', Value:'0'}];
        assert.deepEqual(expRes,tableInfo);
    });

    it('Function with var assignment', ()=>{
        let code='function foo(a){\nlet b=a;\n}\nlet y=0;';
        let vars='foo(1)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i];
        }
        assert.deepEqual('function foo(a){}',result);
    });

    it('Array in arguments for function',()=> {
        let code = 'function foo(array,num){\n' +
            'if(array[1]=="asaf" && num==1){\n' +
            'return true;\n' +
            '}\n' +
            '}';
        let vars = 'foo([87,\'asaf\',false,7],0)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual('function foo(array,num){\n' +
            'if(array [ 1 ]  == "asaf" && num == 1){\n' +
            'return true;\n' +
            '}\n' +
            '}\n', result);
    });

    it('Function with local array assignment', ()=>{
        let code= 'function foo(x,y){\n' +
            'let array=[8,4];\n' +
            'array[x]=array[y];\n' +
            '}';
        let vars='foo(0,1)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(x,y){\n' +
            '}\n');
    });

    it('Global array no arguments', ()=>{
        let code='let array=[true];\n' +
            'function foo(){\n' +
            'let index=0;\n' +
            'if(array[index]){\n' +
            'return true;\n' +
            '\n'+
            '}\n' +
            '}'+'\n   ';
        let vars='';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(){\n' +
            'if(array [ 0 ] ){\n' +
            'return true;\n' +
            '}\n' +
            '}\n');
    });

    it('Array in arguments with single element', ()=>{
        let code= 'function foo(array){\n' +
            'if(array[0]===\'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}';
        let vars='foo(["a"])';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(array){\n' +
            'if(array [ 0 ]  === \'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}\n');
    });
    it('Array in arguments and Unary expression', ()=>{
        let code= 'function foo(array){\n' +
            'if(array[0]==\'eden\'){\n' +
            'return -1;\n' +
            '}\n' +
            '}';
        let vars='foo(["eden",1])';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(array){\n' +
            'if(array [ 0 ]  == \'eden\'){\n' +
            'return - 1;\n' +
            '}\n' +
            '}\n');
    });

    it('Empty function, with /n before', ()=>{
        let code= '\nfunction foo(x){\n}';
        let vars='foo(true)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(x){\n' +
            '}\n');
    });

    it('Assignment for local variables', ()=>{
        let code= 'function foo(x,y){\n' +
            'let z;\n' +
            'let y=x;\n' +
            'z=y;\n' +
            'y=z;\n' +
            '}';
        let vars='foo("a",1)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(x,y){\n' +
            'y=x;\n'+
            '}\n');
    });

    it('Math operation use', ()=>{
        let code= 'function foo(x,y){\n' +
            'let foo=a+b;\n' +
            '}';
        let vars='foo(2,1)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(x,y){\n' +
            '}\n');
    });

    it('Solve minus', ()=>{
        let code= 'function foo(a,b){\n' +
            'let foo=a-b;\n' +
            '}';
        let vars='foo(2,1)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(a,b){\n' +
            '}\n');
    });

    it('Check .length parsing', ()=>{
        let code= 'function foo(array){\n' +
            'if(array.length==0){\n' +
            'return \'Length Is zero\';\n' +
            '}\n' +
            '}';
        let vars='foo(["a",1,true])';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(array){\n' +
            'if(array.length == 0){\n' +
            'return \'Length Is zero\';\n' +
            '}\n' +
            '}\n');
    });

    it('Assignment using argument index to local index', ()=>{
        let code= 'function foo(array,num){\n' +
            'let z=0;\n' +
            'array[z]=array[num];\n' +
            'if(array[z]==3)\n' +
            'return true;\n' +
            '}';
        let vars='foo([1,2,3],2)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(array,num){\n' +
            'array [ 0 ] =3;\n' +
            'if(array [ 0 ]  == 3)\n' +
            'return true;\n' +
            '}\n');
    });

    it('Solve math inside an if statement', ()=>{
        let code= 'function foo(num){\n' +
            'if(num==(100+num))\n' +
            'return false;\n' +
            '}';
        let vars='foo(5)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(num){\n' +
            'if(num == 100 + num)\n' +
            'return false;\n'+
            '}\n');
    });
    it('Math operations and zero handling', ()=>{
        let code= 'function foo(x,y){\n' +
            'let num=0+x;\n' +
            'num=x+0;\n'+
            'num=0+x;\n'+
            'num=x+y;\n'+
            'num=x-0;\n'+
            'num=x-y;\n'+
            'num=3-2;\n'+
            'num=2*3;\n'+
            'num=a*3;\n'+
            'num=2*x;\n'+
            'num=y*x;\n'+
            'num=1/3;\n'+
            'num=x/10;\n'+
            'num=5/x;\n'+
            'num=b/x;\n'+
            '}';
        let vars='foo(76,5)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result=result+newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(x,y){\n' +
            '}\n');
    });
    it('Function with if condition with strong equality', ()=>{
        let code= 'function foo(num){\n' +
            'let array= [5,65,8];\n' +
            'num=array[num];\n' +
            'if (num===1){\n' +
            'return num;\n' +
            '}' +
            '}';
        let vars='foo(2)';
        let temp=parseCode(code);
        makeArray(temp);
        startSubstitution(temp,vars);
        let result='';
        for(let i=0;i<newLines.length;i++){
            result= result+ newLines[i]+'\n';
        }
        assert.deepEqual(result,'function foo(num){\n' +
            'num=8;\n' +
            'if (num === 1){\n' +
            'return num;\n'+
            '}\n' +
            '}\n');
    });

    it('Function with all logic operators ', ()=> {
        let code = 'function foo(x, y, z){\n' +
            'if(x>y)\n' +
            'return false;\n' +
            'else if(x< y)\n' +
            'return true;\n' +
            'else if(x<=z)\n' +
            'return true;\n' +
            'else if((x>=z) || (y!=z))\n' +
            'return false;\n' +
            '}';
        let vars = 'foo(3,6,2)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result = result+  newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo(x, y, z){\n' +
            'if(x > y)\n' +
            'return false;\n' +
            'else if(x < y)\n' +
            'return true;\n' +
            'else if(x <= z)\n' +
            'return true;\n' +
            'else if(x >= z || y != z)\n' +
            'return false;\n' +
            '}\n');
    });

    it('Function with if statement with not=> !', ()=> {
        let code = 'function foo(value){\n' +
            'if(!value)\n' +
            'return value;\n' +
            '}';
        let vars = 'foo(false)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result = result+  newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo(value){\n' +
            'if(! value)\n' +
            'return value;\n' +
            '}\n');
    });

    it('Function with else statement', ()=> {
        let code = 'function foo(num){\n' +
            'if(num<0)\n' +
            'return true;\n' +
            'else\n'+
            'return false;\n'+
            '}';
        let vars = 'foo(-7)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result = result+  newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo(num){\n' +
            'if(num < 0)\n' +
            'return true;\n' +
            'else\n'+
            'return false;\n'+
            '}\n');
    });


    it('Function with else statement with brackets', ()=> {
        let code = 'function foo(num){\n' +
            'if(num<0)\n' +
            'return true;\n' +
            'else{\n'+
            'return false;\n'+
            '}\n'+
            '}';
        let vars = 'foo(-7)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result = result+  newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo(num){\n' +
            'if(num < 0)\n' +
            'return true;\n' +
            'else{\n'+
            'return false;\n'+
            '}\n'+
            '}\n');
    });

    it('Function with while loop ', ()=> {
        let code = 'function foo(num){\n' +
            'while(-num<0){\n' +
            'num=num-2;\n' +
            '}\n'+
            '}';
        let vars = 'foo(10)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result = result+  newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo(num){\n' +
            'while(- num < 0){\n' +
            'num=num - 2;\n' +
            '}\n'+
            '}\n');
    });

    it('Function with update expression for argument with ++', ()=> {
        let code = 'function foo(num,num2){\n' +
            'num++;\n' +
            'if(num==0)\n' +
            'return num2;\n' +
            '}';
        let vars = 'foo(0,10)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result = result+ newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo(num,num2){\n' +
            'num=num + 1;\n' +
            'if(num == 0)\n' +
            'return num2;\n' +
            '}\n');
    });
    it('Function with 2 while loops and arrays ', ()=> {
        let code = 'function foo (items) {\n' +
            'let i=1;\n' +
            'while (i>0) {\n' +
            'let value = items[i];\n' +
            'let j=0;\n' +
            'while (j>0){\n' +
            'items[i+1] = items[j];\n' +
            'items[j ] = value;\n' +
            '}\n' +
            '}\n' +
            'return items;\n' +
            '}\n';
        let vars = 'foo([0,10,2,56])';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result = result+ newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo (items) {\n' +
            'while (1 > 0) {\n' +
            'while (0 > 0){\n' +
            'items [ 2 ] =0;\n' +
            'items [ 0 ] =10;\n' +
            '}\n' +
            '}\n' +
            'return items;\n' +
            '}\n');
    });
    it('Function with unary', ()=> {
        let code = 'function foo(num){\n' +
            'if(-num<0)\n' +
            'return 1;\n' +
            '}';
        let vars = 'foo(1)';
        let temp = parseCode(code);
        makeArray(temp);
        startSubstitution(temp, vars);
        let result = '';
        for (let i = 0; i < newLines.length; i++) {
            result=result+ newLines[i] + '\n';
        }
        assert.deepEqual(result, 'function foo(num){\n' +
            'if(- num < 0)\n' +
            'return 1;\n' +
            '}\n');
    });
});