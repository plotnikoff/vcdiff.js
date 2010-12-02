/**
 * Copyright 2010 Konstantin Plotnikov.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global module, require, window */

(function () {
    var diffable = {};

    diffable.RollingHash = function () {
        this.primeBase = 257;
        this.primeMod = 1000000007;
        this.lastPower = 0;
        this.lastString = '';
        this.lastHash = 0;
    };

    diffable.RollingHash.prototype = {

        /**
         * @private
         * @param {Number} base
         * @param {Number} power
         * @param {Number} modulo
         */
        moduloExp : function (base, power, modulo) {
            var toReturn = 1, i;
            for (i = 0; i < power; i += 1) {
                toReturn = (base * toReturn) % modulo;
            }
            return toReturn;
        },
    
        /**
         * 
         * @param {String} toHash
         */
        hash : function (toHash) {
            var hash = 0, toHashArray = toHash.split(''), i, 
                len = toHashArray.length;
            for (i = 0; i < len; i += 1) {
                hash += (toHashArray[i].charCodeAt(0) * this.moduloExp(this.primeBase, len - 1 - i, this.primeMod)) % this.primeMod;
                hash %= this.primeMod;
            }
            this.lastPower = this.moduloExp(this.primeBase, len - 1, this.primeMod);
            this.lastString = toHash;
            this.lastHash = hash;
            return hash;
        },
    
        /**
         * 
         * @param {String} toAdd
         */
        nextHash : function (toAdd) {
            var hash = this.lastHash, lsArray = this.lastString.split('');
            hash -= (lsArray[0].charCodeAt(0) * this.lastPower);
            hash = hash * this.primeBase + toAdd.charCodeAt(0);
            hash %= this.primeMod;
            if (hash < 0) {
                hash += this.primeMod;
            }
            lsArray.shift();
            lsArray.push(toAdd);
            this.lastString = lsArray.join('');
            this.lastHash = hash;
            return hash;
        }
    };


    /**
     * 
     * @param {String} text
     * @param {Number} offset
     */
    diffable.Block = function (text, offset) {
        this.text = text;
        this.offset = offset;
        this.nextBlock = null;
    };

    diffable.Block.prototype = {
    
        getText : function () {
            return this.text;
        },
    
        getOffset : function () {
            return this.offset;
        },
    
        /**
         * 
         * @param {diffable.Block} nextBlock
         */
        setNextBlock : function (nextBlock) {
            this.nextBlock = nextBlock;
        },

        getNextBlock : function () {
            return this.nextBlock;
        }
    };

    /**
     * 
     * @param {String} originalText
     * @param {Number} blockSize
     */
    diffable.BlockText = function (originalText, blockSize) {
        this.originalText = originalText;
        this.blockSize = blockSize;
        this.blocks = [];
    
        var i, len = originalText.split('').length, endIndex;
        for (i = 0; i < len; i += blockSize) {
            endIndex = i + blockSize >= len ? len : i + blockSize;
            this.blocks.push(new diffable.Block(originalText.substring(i, endIndex), i));
        }
    };

    diffable.BlockText.prototype = {
        getBlocks : function () {
            return this.blocks;
        },

        getOriginalText : function () {
            return this.originalText;
        },

        getBlockSize : function () {
            return this.blockSize;
        }
    };

    diffable.Dictionary = function () {
        this.dictionary = {};
        this.dictionaryText = null;
    };

    diffable.Dictionary.prototype = {
    
        put : function (key, block) {
            if (!this.dictionary.hasOwnProperty(key)) {
                this.dictionary[key] = [];
            }
            this.dictionary[key].push(block);
        },
    
        /**
         * 
         * @param {diffable.BlockText} dictText
         * @param {diffable.RollingHash} hasher
         */
        populateDictionary : function (dictText, hasher) {
            this.dictionary = {};
            this.dictionaryText = dictText;
            var blocks = dictText.getBlocks(), i, len;
            for (i = 0, len = blocks.length; i < len; i += 1) {
                this.put(hasher.hash(blocks[i].getText()), blocks[i]);
            }
        },
    
        /**
         * 
         * @param {Number} hash
         * @param {Number} blockSize
         * @param {String} target
         */
        getMatch : function (hash, blockSize, target) {
            var blocks, i, len, dictText, targetText, currentPointer;
            if (this.dictionary.hasOwnProperty(hash)) {
                blocks = this.dictionary[hash];
                for (i = 0, len = blocks.length; i < len; i += 1) {
                    if (blocks[i].getText() === target.substring(0, blockSize)) {
                        if (this.dictionaryText !== null && blocks[i].getNextBlock() === null) {
                            dictText = this.dictionaryText.getOriginalText().substring(blocks[i].getOffset() + blockSize);
                            targetText = target.substring(blockSize);
                            if (dictText.length === 0 || targetText.length === 0) {
                                return blocks[i];
                            }
                            currentPointer = 0;
                            while (currentPointer < dictText.length && currentPointer < targetText.length &&
                            dictText[currentPointer] === targetText[currentPointer]) {
                                currentPointer += 1;
                            }
                            return new diffable.Block(blocks[i].getText() + dictText.substring(0, currentPointer), blocks[i].getOffset());
                        } else if (blocks[i].getNextBlock() !== null) {
                            return blocks[i];
                        } else {
                            return blocks[i];
                        }
                    }
                }
                return null;
            }
            return null;
        }

    };

    /**
     * 
     * @param {diffable.RollingHash} hasher
     * @param {diffable.Dictionary} target
     */
    diffable.Vcdiff = function (hasher, dictText) {
        this.hash = hasher;
        this.dictText = new diffable.Dictionary();
        this.blockSize = 20;
        this.hash = new diffable.RollingHash();
    };

    diffable.Vcdiff.prototype = {
        /**
         * 
         * @param {String} dict
         * @param {String} target
         */
        encode : function (dict, target) {
            if (dict === target) {
                return [];
            }
            var diffString = [], targetLength, targetIndex, currentHash, 
                addBuffer = '', match;
            this.dictText.populateDictionary(new diffable.BlockText(dict, this.blockSize), this.hash);
            targetLength = target.length;
            targetIndex = 0;
            currentHash = -1;
            while (targetIndex < targetLength) {
                if (targetLength - targetIndex < this.blockSize) {
                    diffString.push(addBuffer + target.substring(targetIndex, targetLength));
                    break;
                } else {
                    if (currentHash === -1) {
                        currentHash = this.hash.hash(target.substring(targetIndex, targetIndex + this.blockSize));
                    } else {
                        currentHash = this.hash.nextHash(target[targetIndex + (this.blockSize - 1)]);
                        if (currentHash < 0) {
                            currentHash = this.hash.hash(target.substring(0, targetIndex + this.blockSize));
                        }
                    }
                    match = this.dictText.getMatch(currentHash, this.blockSize, target.substring(targetIndex));
                    if (match === null) {
                        addBuffer += target[targetIndex];
                        targetIndex += 1;
                    } else {
                        if (addBuffer.length > 0) {
                            diffString.push(addBuffer);
                            addBuffer = '';
                        }
                        diffString.push(match.getOffset());
                        diffString.push(match.getText().length);
                        targetIndex += match.getText().length;
                        currentHash = -1;
                    }
                }
            }
            return diffString;
        },
    
        /**
         * 
         * @param {Object} dict
         * @param {Object} diff
         */
        decode : function (dict, diff) {
            var output = [], i;
            if (diff.length === 0) {
                return dict;
            }
            for (i = 0; i < diff.length; i += 1) {
                if (typeof diff[i] === 'number') {
                    output.push(dict.substring(diff[i], diff[i] + diff[i + 1]));
                    i += 1;
                } else if (typeof diff[i] === 'string') {
                    output.push(diff[i]);
                }
            }
            return output.join('');
        }

    };

    if (typeof module === 'undefined' || typeof require === 'undefined') {
        window.diffable = diffable;
    } else {
        module.exports = diffable;
    }
}());
