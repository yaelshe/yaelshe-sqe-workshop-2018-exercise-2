/* eslint-disable indent */
import $ from 'jquery';
import {makeArray} from './code-analyzer';
import {parseCode} from './code-analyzer';
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
// eslint-disable-next-line no-unused-vars
        let lines= makeArray(parsedCode);

    });
});
//function that describe the table from the array


