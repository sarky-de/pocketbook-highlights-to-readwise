const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

function extractBookNameFromTitle(htmlContent) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const title = document.querySelector('title').textContent;
    let bookName = title.split(' - ')[1].trim(); // Assuming format "date time - book name"
    bookName = bookName.replace(/\.epub/gi, ''); // Remove .epub from the book name
    
    return bookName;
}

function extractTextsFromBookmarks(htmlContent) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    var bookmarks = document.getElementsByClassName('bookmark');
    var extractedData = [];

    for (var i = 0; i < bookmarks.length; i++) {
        var bmPage = bookmarks[i].getElementsByClassName('bm-page')[0];
        var bmText = bookmarks[i].getElementsByClassName('bm-text')[0];
        var bmPageText = bmPage ? bmPage.textContent.trim() : '';
        var bmTextText = bmText ? bmText.textContent.trim() : '';

        extractedData.push({ bmPageText, bmTextText });
    }

    return extractedData;
}

function processHtmlFiles(directoryPath) {
    const files = fs.readdirSync(directoryPath);
    const htmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.html');

    return htmlFiles.map(file => {
        const filePath = path.join(directoryPath, file);
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        const bookName = extractBookNameFromTitle(htmlContent);
        const texts = extractTextsFromBookmarks(htmlContent);

        return { bookName, texts };
    });
}

function jsonToCsv(results) {
    const csvRows = [];
    const headers = ['Highlight', 'Title', 'Location'];
    csvRows.push(headers.join(','));

    results.forEach(result => {
        const bookName = `"${result.bookName}"`; 
        result.texts.forEach(text => {
            if (!text.bmTextText || text.bmTextText.trim() === '' || 
                text.bmTextText.trim() === 'Bookmark') {
                return; 
            }

            const bmTextText = `"${text.bmTextText}"`;
            const bmPageText = `"${text.bmPageText}"`;
            const row = [bmTextText, bookName, bmPageText];
            csvRows.push(row.join(','));
        });
    });

    return csvRows.join('\n');
}

function writeToFile(csvData, filename) {
    fs.writeFile(filename, csvData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing CSV to file:', err);
        } else {
            console.log(`CSV data successfully written to ${filename}`);
        }
    });
}

const result = processHtmlFiles('./export');
const csvData = jsonToCsv(result);
writeToFile(csvData, 'output.csv');
