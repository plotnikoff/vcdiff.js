/*global require, console*/

var diffable = require('../vcdiff'),
q = require('./qunit/qunit').QUnit;

q.test('RollingHash', function () {
    var hash = new diffable.RollingHash(),
        oldPrimeBase = hash.primeBase,
        check = new diffable.RollingHash();
    
    hash.primeBase = 3;
    q.equals(hash.hash('abc'), 1266);
    
    hash.primeBase = oldPrimeBase;
    q.equals(hash.hash('abcabc'), 232878305);
    
    hash.hash('abcg');
    q.equals(check.hash('bcgr'), hash.nextHash('r'));
    q.equals(check.hash('cgrz'), hash.nextHash('z'));
    q.equals(check.hash('grzQ'), hash.nextHash('Q'));
    
    hash.hash('abcdefghijklmnopqrstuvwxyz');
    q.equals(check.hash('bcdefghijklmnopqrstuvwxyza'), hash.nextHash('a'));
    q.equals(check.hash('cdefghijklmnopqrstuvwxyzab'), hash.nextHash('b'));
    q.equals(check.hash('defghijklmnopqrstuvwxyzabQ'), hash.nextHash('Q'));
});

q.test('Block size larger then text', function () {
    var bt = new diffable.BlockText('abc', 5);
    q.equals(1, bt.getBlocks().length);
    q.equals('abc', bt.getBlocks()[0].getText());
    q.equals(0, bt.getBlocks()[0].getOffset());
});

q.test('Three Blocks', function () {
    var bt = new diffable.BlockText('abcdefghi', 3);
    q.equals(3, bt.getBlocks().length);
});

q.test('Three blocks iterate', function () {
    var bt = new diffable.BlockText('abcdefgh', 3),
        bls = bt.getBlocks();
    
    q.equals('abc', bls[0].getText());
    q.equals(0, bls[0].getOffset());
    
    q.equals('def', bls[1].getText());
    q.equals(3, bls[1].getOffset());
    
    q.equals('gh', bls[2].getText());
    q.equals(6, bls[2].getOffset());
});

q.test('Dictionary put', function () {
    var dict = new diffable.Dictionary(), bl;
    dict.put(1, new diffable.Block('abc', 0));
    bl = dict.getMatch(0, 3, '');
    q.equals(bl, null, '');
    bl = dict.getMatch(1, 3, 'abc');
    q.ok(bl !== null);
    q.equals(0, bl.getOffset());
    q.equals('abc', bl.getText());
});

q.test('Dictionary longest block text match', function () {
    var FakeHash = function () {
            this.currentHash = 1;
        },
        fake, b, text, dict;
    FakeHash.prototype.hash = function () {
            return this.currentHash++;
        };

    dict = new diffable.Dictionary();
    text = new diffable.BlockText('abcdef', 3);
    fake = new FakeHash();
    dict.populateDictionary(text, fake);
    b = dict.getMatch(2, 3, 'def');

    q.ok(b !== null);
    q.equals('def', b.getText());
    q.equals(3, b.getOffset());
    
    b = dict.getMatch(1, 3, 'abcdef');
    q.ok(b !== null);
    q.equals('abcdef', b.getText());
    q.equals(0, b.getOffset());
});

q.test('VCDiff encode', function () {
    var vcd = new diffable.Vcdiff();

    q.deepEqual(vcd.encode('abc', 'd'), ['d']);

    q.deepEqual(vcd.encode('abc', 'defghijk'), ['defghijk']);

    vcd.blockSize = 3;
    q.deepEqual(vcd.encode('abcdef', 'abcdef'), []);

    q.deepEqual(vcd.encode('abc', 'defabc'), ['def', 0, 3]);

    q.deepEqual(vcd.encode('abcdef', 'defghiabc'), [3, 3, 'ghi', 0, 3]);
});

q.test('VCDiff decode', function () {
    var vcd = new diffable.Vcdiff(), diff, dict, target;

    dict = 'abc';
    target = 'd';
    diff = vcd.encode(dict, target);
    q.equals(vcd.decode(dict, diff), 'd');

    dict = 'abc';
    target = 'defghijk';
    diff = vcd.encode(dict, target);
    q.equals(vcd.decode(dict, diff), 'defghijk');

    vcd.blockSize = 3;
    
    dict = 'abcdef';
    target = 'abcdef';
    diff = vcd.encode(dict, target);
    q.equals(vcd.decode(dict, diff), 'abcdef');

    dict = 'abc';
    target = 'defabc';
    diff = vcd.encode(dict, target);
    q.equals(vcd.decode(dict, diff), 'defabc');

    dict = 'abcdef';
    target = 'defghiabc';
    diff = vcd.encode(dict, target);
    q.equals(vcd.decode(dict, diff), 'defghiabc');
});

console.log(q.config.stats);
