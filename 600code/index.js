const express = require('express');
const app = express();
const superagent = require('superagent');
const cheerio = require('cheerio');
const trie = require("./trie");
const stopword = require('stopword');
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var table = [];
var hyperlink = [];
var usedLink = new Object();

async function getContent(url) {
    var link = [];
    var tab = {};
    var combine = [];
    var promise = new Promise(function(resolve){
        superagent.get(url).end((err, res) => {
            if(err) {

            }
            else {
                var $ = cheerio.load(res.text);
                $('body').each((i,e) => {
                    let content = {
                        content: $(e).text(),
                        url: url,
                        map: {},
                        title: $('title').text()
                    };
                    tab = content;
                });
                $('a').each((i,e) => {
                    let content = {
                        content: $(e).text(),
                        href: $(e).attr('href')
                    };
                    link.push(content);
                });
                link = link.slice(0, 5);
                combine.push(tab);
                combine.push(link);
                resolve(combine);
            }
        });
    });
    promise.then(function(value){
        return value;
    });
    return promise;
}


var linkRoot = 'localhost:3000';
var initLink = linkRoot + '/1';
var totalNumber = 0;

async function crawler(url) {
    //console.log("1");
    usedLink[url] = 1;
    //console.log(usedLink);
    var combine = await getContent(url);
    table.push(combine[0]);
    hyperlink.push(combine[1]);
    //console.log(table);
    //console.log(hyperlink);
    var pos = hyperlink.length - 1;
    var len = hyperlink[hyperlink.length - 1].length;
    for(var i = 0; i < len; i++) {
        //console.log(usedLink[hyperlink[pos][i]["href"]]);
        if(totalNumber == 10)
            break;
        if(usedLink[linkRoot + hyperlink[pos][i]["href"]] == undefined) {
            //console.log(usedLink);
            usedLink[linkRoot + hyperlink[pos][i]["href"]] = 1;
            totalNumber ++;
            await crawler(linkRoot + hyperlink[pos][i]["href"]);
        }
    }
}

async function addInTrie() {
    for(var ind = 0; ind < table.length; ind ++) {
        var split1 = table[ind]["content"].split(' ');
        var split2 = [];
        for(let i of split1) {
            split2 = split2.concat(i.split(/[,.;//\n\t\r]/));
        }
        var newSt = stopword.removeStopwords(split2);
        for(let word of newSt) {
            if(word != '') {
                if(table[ind]["map"][word.toLowerCase()] == null || table[ind]["map"][word.toLowerCase()] == NaN)
                    table[ind]["map"][word.toLowerCase()] = 1;
                else
                    table[ind]["map"][word.toLowerCase()] += 1;
            }
            trie.addTrie(word.toLowerCase());
        }
    }
}

function compare(property){
    return function(a,b){
        var value1 = a["map"][property];
        var value2 = b["map"][property];
        return value2 - value1;
    }
}


app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname,'index.html')); 
});

app.get('/1', async (req, res) => {
    res.sendFile(path.join(__dirname,'/input/1.html')); 
});
app.get('/2', async (req, res) => {
    res.sendFile(path.join(__dirname,'/input/2.html')); 
});
app.get('/3', async (req, res) => {
    res.sendFile(path.join(__dirname,'/input/3.html')); 
});
app.get('/4', async (req, res) => {
    res.sendFile(path.join(__dirname,'/input/4.html')); 
});
app.get('/5', async (req, res) => {
    res.sendFile(path.join(__dirname,'/input/5.html')); 
});

app.post('/search', (req,res) => {
    if(req.body == null)
        res.send("No data");
    const text = req.body["input"];
    var split1 = text.split(' ');
    var split2 = [];
    for(let i of split1) {
        split2 = split2.concat(i.split(/[,.;\\:\t]/));
    }
    var newSt = stopword.removeStopwords(split2);
    //console.log(newSt);
    var output = [];
    var static = {};
    for(var ind = 0; ind < newSt.length; ind++) {
        if(newSt[ind] == '')
            continue;
        var judge = trie.searchTrie(newSt[ind].toLowerCase());
        if(judge) {
            table.sort(compare(newSt[ind].toLowerCase()));
            for(var i = 0; i < table.length; i++) {
                //console.log(table[i]["map"][newSt[ind].toLowerCase()] + " " + table[i]["url"]);
                if(table[i]["map"][newSt[ind].toLowerCase()] != null) {
                    if(static[table[i]["url"]] == null) {
                        var title = table[i]["title"];
                        var url = table[i]["url"];
                        var ele = {title, url};
                        output.push(ele);
                        static[url] = table[i]["map"][newSt[ind].toLowerCase()];
                    }
                    else {
                        static[table[i]["url"]] += table[i]["map"][newSt[ind].toLowerCase()];
                    }
                }
            }
        }
    }
    //console.log(static);
    //console.log(output);
    output.sort(function(a, b) {
        return static[b["url"]] - static[a["url"]];
    });
    //console.log(output);
    if(output.length > 0)
        res.send(output);
    else {
        res.send("No data");
    }
})

app.listen(3000, async () => {
    await crawler(initLink);
    await addInTrie();
    console.log("The Server Has Been Connected! Port Is 3000");
});