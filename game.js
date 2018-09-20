'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(q) {
    return new Vector(this.x * q, this.y * q);
  }
};

//===================Actor======================
class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector)) {
      throw new Error('Должно быть определено свойство pos, в котором размещен Vector');
    }

    if (!(size instanceof Vector)) {
      throw new Error('Должно быть определено свойство size, в котором размещен Vector');
    }

    if (!(speed instanceof Vector)) {
      throw new Error('Должно быть определено свойство speed, в котором размещен Vector');
    }

    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act() {}

  //left, top, right, bottom
  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(actor) {
    if (!(actor instanceof Actor) || arguments.length == 0) {
      throw new Error(`аргумент ${actor} другого типа или вызван без аргументов`);
    }

    if (this === actor) {
      return false;
    }

    return !((actor.left >= this.right) || (actor.right <= this.left) || (actor.top >= this.bottom) || (actor.bottom <= this.top));
  }
};

//===================Level======================
class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = actors.find(actor => actor.type === 'player');
    this.height = grid.length;
    this.width = grid.reduce((max, item) => {
      if (item.length > max) max = item.length;
      return max
    }, 0);
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return (this.status !== null && this.finishDelay < 0);
  }

  actorAt(player) {
    if (!(player instanceof Actor) || arguments.length === 0) {
      throw new Error('Передан объект другого типа или вызван без аргументов');
    };

    if (this.grid === undefined) {
      return undefined;
    } else {
      return this.actors.find(actor => actor.isIntersect(player));
    };
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Передан объект не типа Vector')
    };

    const left = Math.floor(pos.x);
    const right = Math.ceil(pos.x + size.x);
    const top = Math.floor(pos.y);
    const bottom = Math.ceil(pos.y + size.y);

    if (bottom > this.height) {
      return 'lava';
    };

    if (left < 0 || right > this.width || top < 0) {
      return 'wall';
    };

    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        const bloks = this.grid[y][x];
        if (bloks) {
          return bloks;
        };
      };
    };


  }

  removeActor(actor) {
    const actorIndex = this.actors.indexOf(actor);
    if (actorIndex != -1) {
      this.actors.splice(actorIndex, 1);
    };
  }

  noMoreActors(type) {
    return !(this.actors.some((actor) => actor.type === type));
  }

  playerTouched(typeBlock, actor) {
    if (this.status != null) {
      return;
    };

    if (typeBlock === 'lava' || typeBlock === 'fireball') {
      this.status = 'lost';
    };

    if (typeBlock === 'coin' && actor.type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      };
    };
  }
};

//===================LevelParser======================
class LevelParser {
  constructor(dictionary) {
    //this.dictionary = dictionary;
    //this.dictionary = Object.create(dictionary);
    this.dictionary = Object.assign({}, dictionary);
  }

  actorFromSymbol(symbol) {
    //    if (symbol === undefined) {
    //      return undefined;
    //    };

//    if (this.dictionary[symbol] === undefined) {
//      return undefined;
//    };
    

    return this.dictionary[symbol];
  }
//  actorFromSymbol(symbol) {
//    if (symbol != undefined && Object.keys(this.dictionary).indexOf(symbol) != -1) {
//      return this.dictionary[symbol];
//    }
//  }

  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
    }

    if (symbol === '!') {
      return 'lava';
    }
  }

  createGrid(stringArr) {
    return stringArr.map(line => line.split('')).map(line => line.map(line => this.obstacleFromSymbol(line)));
  }

  createActors(stringArr) {
    var actors = [];
    stringArr.forEach((line, y) => {
      line.split('').forEach((symbol, x) => {
        var constructor = this.dictionary[symbol];
        if (!(typeof constructor === 'function' && new constructor instanceof Actor)) return;
        actors.push(new constructor(new Vector(x, y)));
      });
    });
    return actors;
  }

  parse(stringArr) {
    return new Level(this.createGrid(stringArr), this.createActors(stringArr));
  }
};

//======================blocks================================
class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  act(time, level) {
    const next = this.getNextPosition(time);
    if (level.obstacleAt(next, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = next
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 3));
    this.startingPos = pos;
  }
  handleObstacle() {
    this.pos = this.startingPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.spring = Math.random() * 2 * Math.PI;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.startingPos = this.pos;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startingPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
  }
  get type() {
    return 'player';
  }
}

const schemas = [
  [
    '         ',
    '    =    ',
    '         ',
    '       o ',
    ' @    xxx',
    '         ',
    'xxx      ',
    '         '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];

const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
};

const parser = new LevelParser(actorDict);

loadLevels()
  .then(schemas => {
    return runGame(JSON.parse(schemas), parser, DOMDisplay);
  })
  .then(() => alert('Вы выиграли приз!'));
