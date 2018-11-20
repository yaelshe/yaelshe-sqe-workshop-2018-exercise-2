/* eslint-disable no-unused-vars,indent */
import * as esprima from 'esprima';
let tableInfo = [];
const parseCode = (codeToParse) => {
    // tableInfo = [];
    return esprima.parseScript(codeToParse, {loc: true});

};

export {parseCode};
export {makeArray};
export {tableInfo};


const statmentType = {
    'FunctionDeclaration': functionHeader,
    'VariableDeclaration': parseVar,
    'ExpressionStatement': parseExpression,
    'ReturnStatement': parseReturn,
    'WhileStatement': parseWhile,
    'IfStatement': parseIf,
    'ForStatement': parseFor,
    'AssignmentExpression': parseAssignment,
    'UpdateExpression':parseUpdate};

// TryStatement 'BlockStatement':BreakStatement | ContinueStatement |

function makeArray (ParsedCode) {
    if (ParsedCode.body.length > 0) {
        functionHeader(ParsedCode);
        functionCode((ParsedCode.body)[0].body.body);

    }
}
//handles function's header and parameters
function functionHeader(data)
{
    let name=(data.body)[0].id.name;
    //insert the function declaration
    tableInfo.push({Line:data.loc.start.line, Type:'function declaration',Name:name,Condition:'',Value:''});
    //insert the parameters of the function
    for( let i=0;i<((data.body)[0].params).length;i++)
    {
        let param=(data.body)[0].params[i];
        let paramName=param.name;
        tableInfo.push({Line:data.loc.start.line, Type:'variable declaration',Name:paramName,Condition:'',Value:''});
    }
}

function functionCode(insideBody) {
    for(let j=0;j<insideBody.length;j++)
    {
        //statmentType[.type](insideBody[j]);
        parseItem(insideBody[j]);
    }
}
// function parseFunction(insideBody) {
//
// }

function parseVar(insideBody) {
    for(var j=0 ;j<(insideBody.declarations).length;j++)
    {
        let declaration=insideBody.declarations[j];
        let name=declaration.id.name;
        let value='null';
        if(declaration.init!=null)
            value=getVarValue(declaration.init);
        tableInfo.push({Line:insideBody.loc.start.line, Type:'variable declaration',
                        Name:name,Condition:'', Value:value});
    }
}
function getVarValue(value) {
        if (value.type=='BinaryExpression')
            return getBinaryExpVal(value);
        if (value.type=='Literal')
            return value.value;
        if (value.type=='Identifier')
            return value.name;
        if(value.type=='UnaryExpression')
            return value.operator+' '+value.argument.value;
        return null;
}
function getBinaryExpVal(binaryValue)
{
    let left=simpleBinary(binaryValue.left);
    let operator=binaryValue.operator;
    let right=simpleBinary(binaryValue.right);
    return left+' '+operator+' '+right;
}
function simpleBinary(oneSide) {
    if(oneSide.type=='BinaryExpression')
        oneSide='('+simpleBinary(oneSide)+')';
    else if(oneSide.type=='Literal')
        oneSide=oneSide.value;
    else if(oneSide.type=='Identifier')
        oneSide=oneSide.name;
    return oneSide;
    //maybe add member expression
}
function parseItem(item) {
    statmentType[item.type](item);
}
function parseExpression(insideBody){
    statmentType[insideBody.expression.type](insideBody.expression);
}
//handling return statement
function parseReturn(insideBody) {
    let returnValue=getVarValue(insideBody.argument);
    tableInfo.push({Line:insideBody.loc.start.line, Type:'return statement',
        Name:'',Condition:'', Value:returnValue});
}
//handling while statement
function parseWhile(insideBody) {
    let cond=getVarValue(insideBody.test);
    tableInfo.push({Line:insideBody.loc.start.line, Type:'while statement',
        Name:'',Condition:cond, Value:''});
    //handle the block of while loop
    functionCode(insideBody.body.body);

}
function parseIf(insideBody,type) {
    let cond=getVarValue(insideBody.test);
    if(type==null)
        type='if statement';
    tableInfo.push({Line:insideBody.loc.start.line, Type:type,
        Name:'',Condition:cond, Value:''});
    //handle the block of while loop
    let consequent=insideBody.consequent;
    if(consequent.type=='BlockStatement')
        functionCode(consequent.body);
    else
        parseItem(consequent);
    if(insideBody.alternate!=null)
        parseElse(insideBody.alternate);

}
function parseElse(alternate) {
    if(alternate.type=='IfStatement')
        parseIf(alternate,'else if statement');
    else
    {
        tableInfo.push({Line:alternate.loc.start.line, Type:'else statement',
            Name:'',Condition:' ', Value:''});
    }
    if(alternate.type=='BlockStatement')
        functionCode(alternate.body);
    else
        parseItem(alternate);
}
function parseFor(insideBody) {
    let value=getVarValue(insideBody.init.declarations[0].init);
    let cond=insideBody.init.declarations[0].id.name+'='+value;
    cond=cond+';'+getBinaryExpVal(insideBody.test)+';'
        +insideBody.update.argument.name
        +insideBody.update.operator;
    tableInfo.push({Line:insideBody.loc.start.line, Type:'for statement',
        Name:'',Condition:cond, Value:''});
    functionCode(insideBody.body.body);
}
function parseAssignment(insideBody) {
    let name=insideBody.left.name;
    let right=insideBody.right;
    right=getVarValue(right);
    tableInfo.push({Line:insideBody.loc.start.line, Type:'assignment expression',
        Name:name,Condition:' ', Value:right});
}
function parseUpdate(insideBody) {
    let name=insideBody.argument.name;
    let operator=insideBody.operator;
    tableInfo.push({Line:insideBody.loc.start.line, Type:'update expression',
        Name:name,Condition:' ', Value:name+''+operator});
}
// function makeArrayNofunction(ParsedCodeBody) {
//     for (var i = 0; i < ParsedCodeBody.length; i++) {
//         var type = ParsedCodeBody[i].type;
//         // line.push({Line:ParsedCode.loc.start.line, 'Type':type, 'Name':,Condition Value});
//         return lines;
//     }
// }
