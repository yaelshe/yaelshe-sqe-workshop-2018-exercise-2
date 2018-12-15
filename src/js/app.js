/* eslint-disable indent */
import $ from 'jquery';
import {makeArray} from './code-analyzer';
import {parseCode} from './code-analyzer';
import {functionAfterSubs,newLines,colors} from './symbolicSubstitution';
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        // eslint-disable-next-line no-unused-vars
        //let lines= makeArray(parsedCode);
        let args=$('#argsPlaceholder').val();
        makeArray(parsedCode);
        let lines= makeArray(parsedCode);
        functionAfterSubs(codeToParse,args);
        showFuncAfterSubs();
        insertToTable(lines);
    });

});

function insertToTable(lines) {
   // deleteRows();
    var bodyTable = document.getElementById('bodyTable');
    bodyTable.innerHTML = '';
    for(let i=0;i<lines.length;i++)
    {
        var row=document.createElement('tr');
        row=createRow(i,lines,row);
        bodyTable.appendChild(row);
    }
}

function createRow(i,lines,row){
    let h= document.createElement('td');
    h.textContent=lines[i].Line;
    row.append(h);
    h= document.createElement('td');
    h.textContent=lines[i].Type;
    row.append(h);
    h= document.createElement('td');
    h.textContent=lines[i].Name;
    row.append(h);
    h= document.createElement('td');
    h.textContent=lines[i].Condition;
    row.append(h);
    h= document.createElement('td');
    h.textContent=lines[i].Value;
    row.append(h);
    return row;
}

function showFuncAfterSubs() {

    let htmlObject = document.getElementById('subsFunc');
    let func='';
    for(let i=0;i<newLines.length;i++){
        if(colors.has(i))
        {
            if(colors.get(i))
                func+='<span>'+'<mark style="background-color: green">'+newLines[i]+'</mark>'+'</span>'+'<br>';
            else
                func+='<span>'+'<mark style="background-color: red">'+newLines[i]+'</mark>'+'</span>'+'<br>';
        }
        else
            func+='<span>'+newLines[i]+'\n'+'</span>'+'<br>';
    }
    htmlObject.innerHTML=func;
}
// function deleteRows(){
//     var bodyTable=document.getElementById('bodyTable')
//     for(let i=0;i<bodyTable.rows.length;i++)
//     {
//         document.getElementById('bodyTable').deleteRow(i);
//     }
// }

//function that describe the table from the array


