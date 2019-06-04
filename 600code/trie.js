class Node {
    constructor(val) {
        this.children = {};
        this.parent = null;
        this.end = false;
        this.val = val;
    }
}

class Trie {
    constructor() {
        this.root = new Node(null);
    }

    add(word){
        var node = this.root; 
        for(var i = 0; i < word.length; i++) {
            if (!node.children[word[i]]) {
                node.children[word[i]] = new Node(word[i]);
                node.children[word[i]].parent = node;
            }
            node = node.children[word[i]];
            if (i == word.length-1) {
                node.end = true;
            }
        }
        while(node.parent != null)
            node = node.parent;
        return node;
    }

    search(text){
        var node = this.root;
        if(node == null)
            return;
        for(let char of text) {
            if(node.children[char])
                node = node.children[char];
            else
                return false;
        }
        if(!node.end)
            return false;
        return true;
    }
}

var T = new Trie();

module.exports = {
    Trie,
    addTrie(text) {
        T.root = T.add(text);
    },
    searchTrie(text) {
        return T.search(text);
    },
    seeTrie() {
        return T;
    }
}