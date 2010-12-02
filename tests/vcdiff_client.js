
test('RollingHash', function () {
    var hash = new diffable.RollingHash(),
        oldPrimeBase = hash.primeBase,
        check = new diffable.RollingHash();
    
    hash.primeBase = 3;
    equals(hash.hash('abc'), 1266);
    
    hash.primeBase = oldPrimeBase;
    equals(hash.hash('abcabc'), 232878305);
    
    hash.hash('abcg');
    equals(check.hash('bcgr'), hash.nextHash('r'));
    equals(check.hash('cgrz'), hash.nextHash('z'));
    equals(check.hash('grzQ'), hash.nextHash('Q'));
    
    hash.hash('abcdefghijklmnopqrstuvwxyz');
    equals(check.hash('bcdefghijklmnopqrstuvwxyza'), hash.nextHash('a'));
    equals(check.hash('cdefghijklmnopqrstuvwxyzab'), hash.nextHash('b'));
    equals(check.hash('defghijklmnopqrstuvwxyzabQ'), hash.nextHash('Q'));
});

test('Block size larger then text', function () {
    var bt = new diffable.BlockText('abc', 5);
    equals(1, bt.getBlocks().length);
    equals('abc', bt.getBlocks()[0].getText());
    equals(0, bt.getBlocks()[0].getOffset());
});

test('Three Blocks', function () {
    var bt = new diffable.BlockText('abcdefghi', 3);
    equals(3, bt.getBlocks().length);
});

test('Three blocks iterate', function () {
    var bt = new diffable.BlockText('abcdefgh', 3),
        bls = bt.getBlocks();
    
    equals('abc', bls[0].getText());
    equals(0, bls[0].getOffset());
    
    equals('def', bls[1].getText());
    equals(3, bls[1].getOffset());
    
    equals('gh', bls[2].getText());
    equals(6, bls[2].getOffset());
});

test('Dictionary put', function () {
    var dict = new diffable.Dictionary(), bl;
    dict.put(1, new diffable.Block('abc', 0));
    bl = dict.getMatch(0, 3, '');
    equals(bl, null, '');
    bl = dict.getMatch(1, 3, 'abc');
    ok(bl !== null);
    equals(0, bl.getOffset());
    equals('abc', bl.getText());
});

test('Dictionary longest block text match', function () {
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

    ok(b !== null);
    equals('def', b.getText());
    equals(3, b.getOffset());
    
    b = dict.getMatch(1, 3, 'abcdef');
    ok(b !== null);
    equals('abcdef', b.getText());
    equals(0, b.getOffset());
});

test('VCDiff encode', function () {
    var vcd = new diffable.Vcdiff();

    deepEqual(vcd.encode('abc', 'd'), ['d']);

    deepEqual(vcd.encode('abc', 'defghijk'), ['defghijk']);

    vcd.blockSize = 3;
    deepEqual(vcd.encode('abcdef', 'abcdef'), []);

    deepEqual(vcd.encode('abc', 'defabc'), ['def', 0, 3]);

    deepEqual(vcd.encode('abcdef', 'defghiabc'), [3, 3, 'ghi', 0, 3]);
});

test('VCDiff decode', function () {
    var vcd = new diffable.Vcdiff(), diff, dict, target;

    dict = 'abc';
    target = 'd';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'd');

    dict = 'abc';
    target = 'defghijk';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'defghijk');

    vcd.blockSize = 3;
    
    dict = 'abcdef';
    target = 'abcdef';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'abcdef');

    dict = 'abc';
    target = 'defabc';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'defabc');

    dict = 'abcdef';
    target = 'defghiabc';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'defghiabc');
});

console.log(config.stats);
