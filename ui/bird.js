(function() {
      jQuery.fn.shake = function(intShakes, intDistance, intDuration) {
        return this.each(function() {
          var $this, x;
          $this = $(this).css("position", "relative");
          x = 1;
          while (x <= intShakes) {
            $this.animate({
              left: intDistance * -1
            }, intDuration / intShakes / 4).animate({
              left: intDistance
            }, intDuration / intShakes / 2).animate({
              left: 0
            }, intDuration / intShakes / 4);
            x++;
          }
          return;
        });
      };
    
      var Runner = function() {
        this.FPS = 60;
        this.FRAME_TIME = 1000 / this.FPS;
        this.GROUND_SPEED = 190 / this.FPS;
        this.GRAVITY = 35 / this.FPS;
        this.BIRD_JUMP_SPEED = 510 / this.FPS;
        this.roles = [];
      };
    
      Runner.prototype.add = function(role) {
        this.roles.push(role);
        role.runner = this;
      };
    
      Runner.prototype.run = function() {
        var _this = this;
        var startTime = new Date().getTime();
        setInterval(function() {
          var deltat, newTime;
          newTime = new Date().getTime();
          deltat = newTime - startTime;
          if (deltat > _this.FRAME_TIME) {
            for (var i = 0; i < _this.roles.length; i++) {
              _this.roles[i].draw();
            }
            startTime = newTime;
          }
        }, 1);
      };
    
      var Stage = function() {
        this.$elm = jQuery("<div></div>").addClass("stage").appendTo(document.body);
        this.$ground = jQuery("<div></div>").addClass("ground").appendTo(this.$elm);
        this.bgleft = 0;
        this.move();
      };
    
      Stage.prototype.build_elm = function(name) {
        return jQuery("<div></div>").addClass(name).appendTo(this.$elm);
      };
    
      Stage.prototype.move = function() {
        this.$elm.removeClass("stop");
      };
    
      Stage.prototype.stop = function() {
        this.$elm.addClass("stop");
      };
    
      Stage.prototype.draw = function() {
        if (this.$elm.hasClass("stop")) {
          return;
        }
        this.bgleft -= this.runner.GROUND_SPEED;
        this.$ground.css({
          "background-position": this.bgleft + "px 0"
        });
      };
    
      var Bird = function() {
        this.$elm = jQuery("<div></div>").addClass("bird");
        this.speed = 0;
        this.is_dead = false;
        this.gravity = 0;
        this.lives = 3;
      };
    
      Bird.prototype.draw = function() {
        this._repos();
        this.hit();
        this.updateLivesDisplay();
      };
    
      Bird.prototype._repos = function() {
        if (this.gravity !== 0) {
          if (this.speed > 0) {
            this.$elm.addClass("up").removeClass("down");
          } else {
            this.$elm.addClass("down").removeClass("up");
          }
          var newTop = this.top - this.speed;
          if (newTop >= 418) {
            this.pos(this.left, 418);
            this.speed = 0;
            this.gravity = 0;
          } else {
            this.pos(this.left, newTop);
            this.speed -= this.gravity;
          }
        }
      };
    
      Bird.prototype.pos = function(left, top) {
        this.left = left;
        this.top = top;
        if (this.top < 0) {
          this.top = 0;
        }
        this.$elm.css({
          left: this.left,
          top: this.top
        });
      };
    
      Bird.prototype.hit = function() {
        if (this.is_dead) {
          return;
        }
        if (this.top >= 418) {
          this.state_dead();
          return;
        }
        var pipes = window.game.pipes.pipes;
        if (pipes.length > 0) {
          var p = pipes[0];
          var birdMx = 120.5;
          var pipeMx = p.data("left") + 34.5;
          if (Math.abs(birdMx - pipeMx) <= 56) {
            if (this.top < p.data("y0") || this.top + 15 > p.data("y1")) {
              this.take_damage(p);
            }
          }
        }
      };
    
      Bird.prototype.take_damage = function(pipe) {
        this.lives--;
        pipe.remove();
        window.game.pipes.pipes.shift();
        if (this.lives <= 0) {
          this.state_dead();
        } else {
          this.state_suspend();
          this.pos(99, 237);
          jQuery(document).trigger("bird:take_damage");
        }
      };
    
      Bird.prototype.state_suspend = function() {
        this.$elm.removeClass("no-suspend").removeClass("down").removeClass("up");
        this.speed = 0;
        this.is_dead = false;
        this.$elm.removeClass("dead");
        this.gravity = 0;
      };
    
      Bird.prototype.state_fly = function() {
        this.$elm.addClass("no-suspend");
        this.jump();
      };
    
      Bird.prototype.state_dead = function() {
        this.is_dead = true;
        this.$elm.addClass("dead");
        jQuery(document).trigger("bird:dead");
      };
    
      Bird.prototype.jump = function() {
        if (this.is_dead) {
          return;
        }
        this.gravity = this.runner.GRAVITY;
        this.speed = this.runner.BIRD_JUMP_SPEED;
      };
    
      Bird.prototype.updateLivesDisplay = function() {
        if (window.game.state === "begin") {
          if (this.$livesDisplay) {
            this.$livesDisplay.hide();
          }
          return;
        }
        if (!this.$livesDisplay) {
          this.$livesDisplay = jQuery("<div></div>").addClass("lives-display").appendTo(window.game.stage.$elm);
          this.$livesDisplay.show();
        }
        this.$livesDisplay.html("");
        for (var i = 0; i < this.lives; i++) {
          jQuery("<div></div>").addClass("life-icon").appendTo(this.$livesDisplay);
        }
      };
    
      var Score = function() {
        this.$elm = jQuery("<div></div>").addClass("score");
      };
    
      Score.prototype.set = function(score) {
        this.score = score;
        this.$elm.html("");
        var scoreStr = score.toString();
        for (var i = 0; i < scoreStr.length; i++) {
          var num = scoreStr[i];
          jQuery("<div></div>").addClass("number").addClass("n" + num).appendTo(this.$elm);
        }
        var _this = this;
        setTimeout(function() {
          _this.$elm.css({
            "margin-left": -_this.$elm.width() / 2
          });
        }, 1);
      };
    
      Score.prototype.inc = function() {
        this.set(this.score + 1);
      };
    
      var ScoreBoard = function() {
        this.$elm = jQuery("<div></div>").addClass("score_board");
        this.$score = jQuery("<div></div>").addClass("score").appendTo(this.$elm).css({
          left: "auto",
          top: 45,
          right: 30
        });
        this.$max_score = jQuery("<div></div>").addClass("score").appendTo(this.$elm).css({
            left: "auto",
      top: 102,
      right: 30
    });
    this.$new_record = jQuery("<div></div>").addClass("new_record").appendTo(this.$elm);
  };

  ScoreBoard.prototype.set = function(score) {
    if (!localStorage.max_score) {
      localStorage.max_score = 0;
    }
    if (localStorage.max_score < score) {
      localStorage.max_score = score;
      this.$new_record.show();
    } else {
      this.$new_record.hide();
    }
    this.$score.html("");
    this.$max_score.html("");
    var scoreStr = score.toString();
    for (var i = 0; i < scoreStr.length; i++) {
      var num = scoreStr[i];
      jQuery("<div></div>").addClass("number").addClass("n" + num).appendTo(this.$score);
    }
    var maxScoreStr = localStorage.max_score.toString();
    for (var i = 0; i < maxScoreStr.length; i++) {
      var num = maxScoreStr[i];
      jQuery("<div></div>").addClass("number").addClass("n" + num).appendTo(this.$max_score);
    }
  };

  var Pipes = function() {
    this.xgap = 209;
    this.ygap = 128;
    this.pipes = [];
    this.is_stop = true;
  };

  Pipes.prototype.generate = function() {
    var y0 = Math.floor(Math.random() * (250 - 70 + 1) + 70);
    var y1 = y0 + this.ygap;
    var lastPipe = this.pipes[this.pipes.length - 1];
    var left = lastPipe ? lastPipe.data("left") + this.xgap : 384 * 2;
    var $pipe = jQuery("<div></div>").addClass("pipe").css("left", left).data("left", left).data("y0", y0).data("y1", y1).data("passed", false).data("scored", false);
    jQuery("<div></div>").addClass("top").appendTo($pipe).css({
      height: y0
    });
    jQuery("<div></div>").addClass("bottom").appendTo($pipe).css({
      top: y1
    });
    this.pipes.push($pipe);
    jQuery(document).trigger("pipe:created", $pipe);
  };

  Pipes.prototype.draw = function() {
    if (this.is_stop) {
      return;
    }
    for (var i = 0; i < this.pipes.length; i++) {
      var $pipe = this.pipes[i];
      var left = $pipe.data("left") - this.runner.GROUND_SPEED;
      $pipe.css("left", left).data("left", left);
    }
    if (this.pipes.length < 3) {
      this.generate();
    }
    if (this.pipes.length > 0) {
      var pipe0 = this.pipes[0];
      if (pipe0.data("left") < -69) {
        pipe0.remove();
        this.pipes.splice(0, 1);
      }
      if (pipe0.data("left") < 86) {
        if (!pipe0.data("passed") && !pipe0.data("scored")) {
          pipe0.data("passed", true);
          pipe0.data("scored", true);
          jQuery(document).trigger("score:add");
        }
      }
    }
  };

  Pipes.prototype.stop = function() {
    this.is_stop = true;
  };

  Pipes.prototype.clear = function() {
    for (var i = 0; i < this.pipes.length; i++) {
      this.pipes[i].remove();
    }
    this.pipes = [];
  };

  Pipes.prototype.start = function() {
    this.is_stop = false;
    this.generate();
  };

  var Game = function(stage) {
    this.stage = new Stage();
    this.bird = new Bird();
    this.score = new Score();
    this.score_board = new ScoreBoard();
    this.pipes = new Pipes();
    this.runner = new Runner();
    this.runner.add(this.bird);
    this.runner.add(this.pipes);
    this.runner.add(this.stage);
    this.runner.run();
    this._init_objects();
    this._init_events();
  };

  Game.prototype._init_objects = function() {
    this.$logo = this.stage.build_elm("logo");
    this.$start = this.stage.build_elm("start");
    this.$ok = this.stage.build_elm("ok");
    this.$share = this.stage.build_elm("share");
    this.$get_ready = this.stage.build_elm("get_ready");
    this.$tap = this.stage.build_elm("tap");
    this.$game_over = this.stage.build_elm("game_over");
    this.$score_board = this.score_board.$elm.appendTo(this.stage.$elm);
    this.$bird = this.bird.$elm.appendTo(this.stage.$elm);
    this.$score = this.score.$elm.appendTo(this.stage.$elm);
    this.objects = {
      logo: this.$logo,
      start: this.$start,
      ok: this.$ok,
      share: this.$share,
      get_ready: this.$get_ready,
      game_over: this.$game_over,
      tap: this.$tap,
      score: this.$score,
      score_board: this.$score_board,
      bird: this.$bird
    };
  };

  Game.prototype._init_events = function() {
    var _this = this;
    this.$start.on("click", function() {
      _this.stage.$elm.fadeOut(200, function() {
        _this.ready();
        _this.stage.$elm.fadeIn(200);
      });
    });
    this.$ok.on("click", function() {
      _this.stage.$elm.fadeOut(200, function() {
        _this.begin();
        _this.stage.$elm.fadeIn(200);
      });
    });
    this.$share.on("click", function() {
      bShare.more(event);
    });
    this.stage.$elm.on("mousedown", function() {
      if (_this.state === "ready") {
        _this.fly();
        return;
      }
      if (_this.state === "fly") {
        _this.bird.jump();
      }
    });
    jQuery(document).on("bird:dead", function() {
      _this.over();
    });
    jQuery(document).on("bird:hit", function() {
      _this.bird.state_dead();
    });
    jQuery(document).on("pipe:created", function(evt, $pipe) {
      _this.stage.$elm.append($pipe);
    });
    jQuery(document).on("score:add", function() {
      _this.score.inc();
    });
    jQuery(document).on("bird:take_damage", function() {
      _this.bird.state_suspend();
      _this.bird.pos(99, 237);
    });
  };

  Game.prototype._show = function() {
    var args = Array.prototype.slice.call(arguments);
    for (var key in this.objects) {
      this.objects[key].hide();
    }
    for (var i = 0; i < args.length; i++) {
      var obj = this.objects[args[i]];
      if (obj) {
        obj.show();
      }
    }
  };

  Game.prototype.begin = function() {
    this.state = "begin";
    this._show("logo", "bird", "start");
    this.bird.pos(310, 145);
    this.bird.lives = 3;
    this.stage.move();
    this.bird.state_suspend();
    this.pipes.clear();
  };

  Game.prototype.ready = function() {
    this.state = "ready";
    this._show("bird", "tap", "score");
    this.$get_ready.fadeIn(400);
    this.bird.pos(99, 237);
    this.bird.state_suspend();
    this.score.set(0);
  };

  Game.prototype.fly = function() {
    this.state = "fly";
    this._show("get_ready", "bird", "tap", "score");
    this.$get_ready.fadeOut(400);
    this.$tap.fadeOut(400);
    this.bird.state_fly();
    this.pipes.start();
  };

  Game.prototype.over = function() {
    var _this = this;
    this.state = "over";
    this._show("bird", "score");
    this.stage.stop();
    this.pipes.stop();
    this.stage.$elm.shake(6, 3, 100);
    setTimeout(function() {
      _this.$score.fadeOut();
      _this.$game_over.fadeIn(function() {
        _this.score_board.set(_this.score.score);
        _this.$score_board.show().css({
          top: 512
        }).delay(300).animate({
          top: 179
        }, function() {
          _this.$ok.fadeIn();
          _this.$share.fadeIn();
        });
      });
    }, 500);
  };

  $(function() {
    window.game = new Game();
    window.game.begin();
  });

}).call(this);