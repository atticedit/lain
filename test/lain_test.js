//run mocha from project root

var assert = require('assert');
var Lain = require('../dist/lain.umd.js');

var root = Lain;

var packetLog;
var msgLog;
var contextLog;

function Watcher(name){

    this.name = name;

}

Watcher.prototype.tell = function(msg, packet){

    callback(msg, packet, this);

};

function callback(msg, packet){

    msgLog.push(msg);
    packetLog.push(packet);
    contextLog.push(this);

}

function resetLog(){

    packetLog = [];
    msgLog = [];
    contextLog = [];

}


describe('Lain', function(){

    var world;

        before(function(){

            root.clear();
            world = root.createChild('world');

        });

        afterEach(function(){

            resetLog();

        });

        it('can create named data', function(){

            var d = world.data('ergo');
            var name = d.name();
            assert.equal(name, 'ergo');

        });

        it('can write data', function(){

            var d = world.data('ergo');
            d.write('proxy');
            var value = d.read();

            assert.equal(value, 'proxy');

        });

        it('can modify data', function(){

            var d = world.data('ergo');
            d.write('autoreiv');
            var value = d.read();

            assert.equal(value, 'autoreiv');

        });



        it('can toggle data', function(){

            var d = world.data('ergo');
            d.toggle();
            assert.equal(d.read(), false);
            d.toggle();
            assert.equal(d.read(), true);
            d.toggle();
            assert.equal(d.read(), false);

        });


        it('can subscribe to data', function(){

            var d = world.data('ergo');
            d.subscribe(callback);
            d.write('Re-L');
            var value = msgLog[0];
            assert.equal(value, 'Re-L');

        });

    it('can drop subscriptions to data', function(){

        var d = world.data('ergo');
        d.subscribe(callback);
        d.write('Re-L');
        d.drop(callback);
        d.write('Vincent');
        var value = msgLog[0];
        assert.equal(value, 'Re-L');

    });


    it('can refresh existing data', function(){

        world.clear();
        var d = world.data('ergo');
        d.subscribe(callback);
        d.write('Vincent');
        d.write('Re-L');
        d.refresh();

        var lastValue = msgLog[2];
        assert.equal(lastValue, 'Re-L');
        assert.equal(msgLog.length, 3);

    });

        it('can subscribe to topics', function(){

            world.clear();
            var d = world.data('ergo');
            d.subscribe(callback, 'arcology');
            d.write('Vincent', 'character');
            d.write('Re-L', 'character');
            d.write('Romdeau', 'arcology');
            d.write('wasteland');

            var value = msgLog[0];
            assert.equal(value, 'Romdeau');
            assert.equal(msgLog.length, 1);

        });

    it('can drop subscriptions to topics', function(){

        world.clear();
        var d = world.data('ergo');
        d.subscribe(callback, 'arcology');
        d.write('Vincent', 'character');
        d.write('Re-L', 'character');
        d.write('Romdeau', 'arcology');
        d.write('wasteland');
        d.drop(callback, 'arcology');
        d.write('Vincent', 'arcology');

        var value = msgLog[0];
        assert.equal(value, 'Romdeau');
        assert.equal(msgLog.length, 1);

    });

    it('can read data by topic', function(){

        world.clear();
        var d = world.data('ergo');

        d.write('Vincent', 'character');
        d.write('Re-L', 'character');
        d.write('Romdeau', 'arcology');
        d.write('wasteland');

        assert.equal(d.read('arcology'), 'Romdeau');
        assert.equal(d.read('character'), 'Re-L');
        assert.equal(d.read(), 'wasteland');


    });

    it('can peek at packets by topic', function(){

        world.clear();
        var d = world.data('ergo');

        d.write('Vincent', 'character');
        d.write('Re-L', 'character');
        d.write('Romdeau', 'arcology');
        d.write('wasteland');

        assert.equal(d.peek('arcology').msg, 'Romdeau');
        assert.equal(d.peek('arcology').source, 'ergo');
        assert.equal(d.peek('character').topic, 'character');
        assert.equal(d.peek().topic, null);

    });

        it('can monitor all topics', function(){

            world.clear();
            var d = world.data('ergo');
            d.monitor(callback);
            d.write('Vincent', 'character');
            d.write('Re-L', 'character');
            d.write('Romdeau', 'arcology');
            d.write('wasteland');

            var value = msgLog[2];
            var topic = packetLog[1].topic;
            assert.equal(value, 'Romdeau');
            assert.equal(topic, 'character');
            assert.equal(msgLog.length, 4);

        });

    it('creates child scopes', function(){

        world.clear();

        var city1 = world.createChild();
        var city2 = world.createChild();

        var d0 = world.data('ergo');
        var d1 = city1.data('ergo');
        var d2 = city2.data('proxy');

        d0.write('0');
        d1.write('1');
        d2.write('2');

        assert.equal(d0.read(), '0');
        assert.equal(d1.read(), '1');
        assert.equal(d2.read(), '2');

    });

    it('finds data in higher scopes', function(){

        world.clear();

        var city1 = world.createChild();
        var city2 = world.createChild();

        var d0 = world.data('ergo');
        var d1 = city1.data('ergo');
        var d2 = city2.data('proxy');

        d0.write('0');
        d1.write('1');
        d2.write('2');

        var f1 = city1.find('ergo');
        var f2 = city2.find('ergo');

        assert.equal(f1.read(), '1');
        assert.equal(f2.read(), '0');

    });

    it('can insert a scope', function(){

        world.clear();

        var region = world.createChild();
        var city1 = world.createChild();

        city1.insertParent(region);

        var d0 = world.data('ergo');
        var d1 = region.data('ergo');
        var d2 = city1.data('proxy');

        d0.write('0');
        d1.write('1');
        d2.write('2');

        var f1 = region.find('ergo');
        var f2 = city1.find('ergo');

        assert.equal(f1.read(), '1');
        assert.equal(f2.read(), '1');

    });

    it('can write transactions via multiWrite', function(){

        resetLog();
        world.clear();

        var city1 = world.createChild();

        var d0 = world.data('proxy');
        var d1 = city1.data('ergo');
        var d2 = city1.data('autoreiv');

        var result;

        d0.subscribe(function(msg){
            result = msg;
            assert(d0.read(), 'grey');
            assert(d1.read(), 'black');
            assert(d2.read(), 'chrome');
        });

        city1.multiWrite([
            {name: 'proxy', value: 'grey'},
            {name: 'ergo', value: 'black'},
            {name: 'autoreiv', value: 'chrome'}
        ]);

        assert(result, 'grey');


    });


    it('can create actions as ephemeral data', function(){

        world.clear();

        var city1 = world.createChild();

        var d0 = world.action('ergo');
        var d1 = city1.data('ergo');

        d0.subscribe(callback);

        d0.write('0');
        d1.write('1');

        assert.equal(d0.read(), undefined);
        assert.equal(d0.peek(), null);
        assert.equal(d1.peek().msg, '1');
        assert.equal(msgLog[0], '0');
        assert.equal(d1.read(), '1');

    });

    it('valves can restrict data in higher scopes', function(){


        world.clear();


        var city1 = world.createChild();
        var city2 = world.createChild();

        var d0 = world.data('ergo');
        var d1 = city1.data('ergo');
        var d2 = city2.data('proxy');

        var d3 = world.data('Re-L');
        world.valve('Re-L');

        d0.write('0');
        d1.write('1');
        d2.write('2');
        d3.write('3');

        var f1 = city1.find('ergo');
        var f2 = city2.find('ergo');
        var f3 = city1.find('Re-L');
        var f4 = world.find('Re-L');
        var f5 = world.find('ergo');

        assert.equal(f1.read(), '1'); // access never encounters valve above
        assert.equal(f2, null); // access blocked by valve
        assert.equal(f3.read(), '3'); // remote access through valve
        assert.equal(f4.read(), '3'); // local access through valve
        assert.equal(f5.read(), '0'); // local access despite valve (valves only block from below)

    });

    it('can mirror data for read-only access', function(){

        world.clear();

        var city1 = world.createChild();
        var city2 = world.createChild();

        var d0 = world.data('ergo');
        var d1 = city1.data('ergo');
        var d2 = city2.data('proxy');

        d0.write('0');
        d1.write('1');
        d2.write('2');

        world.mirror('ergo');

        var f1 = city1.find('ergo');
        var f2 = city2.find('ergo');

        d0.write('3');

        assert.equal(f1.read(), '1');
        assert.equal(f2.read(), '3');
        assert.equal(f2._readOnly, true);

        var v1 = city1.readDataSet(['ergo', 'proxy']);
        var v2 = city2.readDataSet(['ergo', 'proxy']);

        var writeToMirror = function(){ f2.write('4'); };

        assert.throws(writeToMirror, /Data from a mirror .* ergo/);

    });

    it('can create states for data that is read-only from below', function(){

        world.clear();

        var city1 = world.createChild();

        var d0 = world.state('ergo'); // creates a mirror under the hood
        var d1 = city1.data('proxy');

        d0.write('0');
        d1.write('1');

        var f1 = city1.find('ergo'); // from below, finds mirror as read-only
        var f2 = world.find('ergo'); // locally, finds data with write access

        f2.write('3'); // can write to state, affects both data and mirror

        assert.equal(f1.read(), '3');
        assert.equal(f2.read(), '3');
        assert.equal(f1._readOnly, true);

        var writeToMirror = function(){ f1.write('4');};
        assert.throws(writeToMirror, Error, 'Data from a mirror is read-only.');

    });

    it('can create data in different dimensions', function(){

        world.clear();
        var city1 = world.createChild();

        world.data('ergo').write('defaultErgo');
        world.data('proxy').write('defaultProxy');
        city1.data('proxy').write('defaultCityProxy');

        world = world.dimension('path');
        city1 = city1.dimension('path');

        var d0 = world.state('ergo').write('pathErgo');
        var d1 = city1.data('proxy').write('pathProxy');

        var f1 = city1.find('proxy');
        var f2 = world.find('ergo');

        var f3 = city1.dimension().find('ergo');

        //f2.write('3'); // can write to state, affects both data and mirror
        //
        assert.equal(f1.read(), 'pathProxy');
        assert.equal(f2.read(), 'pathErgo');
        assert.equal(f3.read(), 'defaultErgo');


        //var up = Catbus.fromEvent('mouseup');
        //var down = Catbus.fromEvent('mousedown');
        //var move = Catbus.fromEvent.('mousemove');

        //var drag = up.add(down).merge().transform(dragging).name('dragging');
        //var render = move.add(drag).merge().group().sync().filter(dragging).batch().render();
        //
        //var drag = Catbus.merge(up, down)
        //var render = Catbus.snap(move, drag).
        //var render = Catbus.while(dragging).status(move);
        //assert.equal(f1.readOnly, true);
        //
        //var writeToMirror = function(){ f1.write('4');};
        //assert.throws(writeToMirror, Error, 'Data from a mirror is read-only.');

    });


});


