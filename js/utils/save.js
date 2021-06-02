// ************ Save stuff ************
function save() {
	localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(player)))));
  //ok it saved fine so the problem must be when loading
}
function startPlayerBase() {
	return {
		tab: layoutInfo.startTab,
		navTab: (layoutInfo.showTree ? "tree-tab" : "none"),
		time: Date.now(),
		autosave: true,
		notify: {},
		msDisplay: "always",
		offlineProd: true,
		versionType: modInfo.id,
		version: VERSION.num,
		beta: VERSION.beta,
		timePlayed: 0,
		keepGoing: false,
		hasNaN: false,
		hideChallenges: false,
		showStory: true,
		forceOneTab: false,
		points: modInfo.initialStartPoints,
		subtabs: {},
		lastSafeTab: (readData(layoutInfo.showTree) ? "none" : layoutInfo.startTab)
	};
}
function getStartPlayer() {
	playerdata = startPlayerBase();

	if (addedPlayerData) {
		extradata = addedPlayerData();
		for (thing in extradata)
			playerdata[thing] = extradata[thing];
	}

	playerdata.infoboxes = {};
	for (layer in layers) {
		playerdata[layer] = getStartLayerData(layer);

		if (layers[layer].tabFormat && !Array.isArray(layers[layer].tabFormat)) {
			playerdata.subtabs[layer] = {};
			playerdata.subtabs[layer].mainTabs = Object.keys(layers[layer].tabFormat)[0];
		}
		if (layers[layer].microtabs) {
			if (playerdata.subtabs[layer] == undefined)
				playerdata.subtabs[layer] = {};
			for (item in layers[layer].microtabs)
				playerdata.subtabs[layer][item] = Object.keys(layers[layer].microtabs[item])[0];
		}
		if (layers[layer].infoboxes) {
			if (playerdata.infoboxes[layer] == undefined)
				playerdata.infoboxes[layer] = {};
			for (item in layers[layer].infoboxes)
				playerdata.infoboxes[layer][item] = false;
		}

	}
	return playerdata;
}
function getStartLayerData(layer) {
	layerdata = {};
	if (layers[layer].startData)
		layerdata = layers[layer].startData();

	if (layerdata.unlocked === undefined)
		layerdata.unlocked = true;
	if (layerdata.total === undefined)
		layerdata.total = new ExpantaNum(0);
	if (layerdata.best === undefined)
		layerdata.best = new ExpantaNum(0);
	if (layerdata.resetTime === undefined)
		layerdata.resetTime = 0;
        if (layerdata.forceTooltip === undefined)
                layerdata.forceTooltip = false;

        layerdata.buyables = getStartBuyables(layer);
        if (layerdata.noRespecConfirm === undefined) layerdata.noRespecConfirm = false
	if (layerdata.clickables == undefined)
		layerdata.clickables = getStartClickables(layer);
	layerdata.spentOnBuyables = new ExpantaNum(0);
	layerdata.upgrades = [];
	layerdata.milestones = [];
	layerdata.lastMilestone = null;
	layerdata.achievements = [];
	layerdata.challenges = getStartChallenges(layer);
	layerdata.grid = getStartGrid(layer);
	return layerdata;
}
function getStartBuyables(layer) {
	let data = {};
	if (layers[layer].buyables) {
		for (id in layers[layer].buyables)
			if (isPlainObject(layers[layer].buyables[id]))
				data[id] = new ExpantaNum(0);
	}
	return data;
}
function getStartClickables(layer) {
	let data = {};
	if (layers[layer].clickables) {
		for (id in layers[layer].clickables)
			if (isPlainObject(layers[layer].clickables[id]))
				data[id] = "";
	}
	return data;
}
function getStartChallenges(layer) {
	let data = {};
	if (layers[layer].challenges) {
		for (id in layers[layer].challenges)
			if (isPlainObject(layers[layer].challenges[id]))
				data[id] = 0;
	}
	return data;
}
function fixSave() {
	defaultData = getStartPlayer();
	fixData(defaultData, player);

	for (layer in layers) {
		if (player[layer].best !== undefined)
			player[layer].best = new ExpantaNum(player[layer].best);
		if (player[layer].total !== undefined)
			player[layer].total = new ExpantaNum(player[layer].total);

		if (layers[layer].tabFormat && !Array.isArray(layers[layer].tabFormat)) {

			if (!Object.keys(layers[layer].tabFormat).includes(player.subtabs[layer].mainTabs))
				player.subtabs[layer].mainTabs = Object.keys(layers[layer].tabFormat)[0];
		}
		if (layers[layer].microtabs) {
			for (item in layers[layer].microtabs)
				if (!Object.keys(layers[layer].microtabs[item]).includes(player.subtabs[layer][item]))
					player.subtabs[layer][item] = Object.keys(layers[layer].microtabs[item])[0];
		}
	}
}
function getStartGrid(layer) {
	let data = {};
	if (! layers[layer].grid) return data
	if (layers[layer].grid.maxRows === undefined) layers[layer].grid.maxRows=layers[layer].grid.rows
	if (layers[layer].grid.maxCols === undefined) layers[layer].grid.maxCols=layers[layer].grid.cols

	for (let y = 1; y <= layers[layer].grid.maxRows; y++) {
		for (let x = 1; x <= layers[layer].grid.maxCols; x++) {
			data[100*y + x] = layers[layer].grid.getStartData(100*y + x)
		}
	}
	return data;
}
function fixData(defaultData, newData) {
	for (item in defaultData) {
		if (defaultData[item] == null) {
			if (newData[item] === undefined)
				newData[item] = null;
		}
		else if (Array.isArray(defaultData[item])) {
			if (newData[item] === undefined)
				newData[item] = defaultData[item];

			else
				fixData(defaultData[item], newData[item]);
		}
		else if (defaultData[item] instanceof ExpantaNum) { // Convert to ExpantaNum
			if (newData[item] === undefined)
				newData[item] = defaultData[item];

			else{
                let newItemThing=new ExpantaNum(0)
				newItemThing.array = newData[item].array
				newItemThing.sign = newData[item].sign
				newItemThing.layer = newData[item].layer
                newData[item] = newItemThing
            } 
		}
		else if ((!!defaultData[item]) && (typeof defaultData[item] === "object")) {
			if (newData[item] === undefined || (typeof defaultData[item] !== "object"))
				newData[item] = defaultData[item];

			else
				fixData(defaultData[item], newData[item]);
		}
		else {
			if (newData[item] === undefined)
				newData[item] = defaultData[item];
		}
	}
}
function load() {
	let get = localStorage.getItem(modInfo.id);
	if (get === null || get === undefined)
		player = getStartPlayer();
	else
		player = Object.assign(getStartPlayer(), JSON.parse(atob(get)));
	fixSave();

	if (player.offlineProd) {
		if (player.offTime === undefined)
			player.offTime = { remain: 0 };
		player.offTime.remain += (Date.now() - player.time) / 1000;
	}
	player.time = Date.now();
	versionCheck();
	changeTheme();
	changeTreeQuality();
	updateLayers();
	setupModInfo();

	setupTemp();
	updateTemp();
	updateTemp();
	updateTabFormats();
	loadVue();
}
function setupModInfo() {
	modInfo.changelog = changelog;
	modInfo.winText = winText ? winText : `Congratulations! You have reached the end and beaten this game, but for now...`;

}
function fixNaNs() {
	NaNcheck(player);
}
function NaNcheck(data) {
	for (item in data) {
		if (data[item] == null) {
		}
		else if (Array.isArray(data[item])) {
			NaNcheck(data[item]);
		}
		else if (data[item] !== data[item] || data[item] === decimalNaN) {
			if (NaNalert === true || confirm("Invalid value found in player, named '" + item + "'. Please let the creator of this mod know! Would you like to try to auto-fix the save and keep going?")) {
				NaNalert = true;
				data[item] = (data[item] !== data[item] ? 0 : decimalZero);
			}
			else {
				clearInterval(interval);
				player.autosave = false;
				NaNalert = true;
			}
		}
		else if (data[item] instanceof ExpantaNum) { // Convert to ExpantaNum
		}
		else if ((!!data[item]) && (data[item].constructor === Object)) {
			NaNcheck(data[item]);
		}
	}
}
function exportSave() {
	let str = btoa(JSON.stringify(player));

	const el = document.createElement("textarea");
	el.value = str;
	document.body.appendChild(el);
	el.select();
	el.setSelectionRange(0, 99999);
	document.execCommand("copy");
	document.body.removeChild(el);
}
;(function (globalScope) {
  "use strict";


  // --  EDITABLE DEFAULTS  -- //
    var OmegaNum = {

      // The maximum number of arrows accepted in operation.
      // It will warn and then return Infinity if exceeded.
      // This is to prevent loops to not be breaking, and also to prevent memory leaks.
      // 1000 means operation above {1000} is disallowed.
      // It is not recommended to make this number too big.
      // `OmegaNum.maxArrow = 1000;`
      maxArrow: 1e3,

      // Specify what format is used when serializing for JSON.stringify
      // 
      // JSON   0 JSON object
      // STRING 1 String
      serializeMode: 0,
      
      // Level of debug information printed in console
      // 
      // NONE   0 Show no information.
      // NORMAL 1 Show operations.
      // ALL    2 Show everything.
      debug: 0
    },


  // -- END OF EDITABLE DEFAULTS -- //


    external = true,

    omegaNumError = "[OmegaNumError] ",
    invalidArgument = omegaNumError + "Invalid argument: ",

    isOmegaNum = /^[-\+]*(Infinity|NaN|(10(\^+|\{[1-9]\d*\})|\(10(\^+|\{[1-9]\d*\})\)\^[1-9]\d* )*((\d+(\.\d*)?|\d*\.\d+)?([Ee][-\+]*))*(0|\d+(\.\d*)?|\d*\.\d+))$/,

    MAX_SAFE_INTEGER = 9007199254740991,
    MAX_E = Math.log10(MAX_SAFE_INTEGER), //15.954589770191003

    // OmegaNum.prototype object
    P={},
    // OmegaNum static object
    Q={},
    // OmegaNum constants
    R={};

  // OmegaNum prototype methods

  /*
   *  absoluteValue             abs
   *  affordArithmeticSeries
   *  affordGeometricSeries
   *  arrow
   *  ceiling                   ceil
   *  chain
   *  choose
   *  comparedTo                cmp
   *  cubeRoot                  cbrt
   *  divide                    div
   *  equals                    eq
   *  exponential               exp
   *  factorial                 fact
   *  floor
   *  gamma
   *  generalLogarithm          log10
   *  greaterThan               gt
   *  greaterThanOrEqualTo      gte
   *  hyper
   *  isFinite
   *  isInfinite
   *  isInteger                 isint
   *  isNaN
   *  isNegative                isneg
   *  isPositive                ispos
   *  iteratedexp
   *  iteratedlog
   *  lambertw
   *  layeradd
   *  layeradd10
   *  lessThan                  lt
   *  lessThanOrEqualTo         lte
   *  logarithm                 logBase
   *  minus                     sub
   *  modulo                    mod
   *  naturalLogarithm          ln        log
   *  negated                   neg
   *  notEquals                 neq
   *  pentate                   pent
   *  plus                      add
   *  reciprocate               rec
   *  root
   *  round
   *  slog
   *  squareRoot                sqrt
   *  ssqrt                     ssrt
   *  sumArithmeticSeries
   *  sumGeometricSeries
   *  times                     mul
   *  tetrate                   tetr
   *  toExponential
   *  toFixed
   *  toHyperE
   *  toJSON
   *  toNumber
   *  toPower                   pow
   *  toPrecision
   *  toString
   *  toStringWithDecimalPlaces
   *  valueOf
   */
  R.ZERO=0;
  R.ONE=1;
  R.E=Math.E;
  R.LN2=Math.LN2;
  R.LN10=Math.LN10;
  R.LOG2E=Math.LOG2E;
  R.LOG10E=Math.LOG10E;
  R.PI=Math.PI;
  R.SQRT1_2=Math.SQRT1_2;
  R.SQRT2=Math.SQRT2;
  R.MAX_SAFE_INTEGER=MAX_SAFE_INTEGER;
  R.MIN_SAFE_INTEGER=Number.MIN_SAFE_INTEGER;
  R.NaN=Number.NaN;
  R.NEGATIVE_INFINITY=Number.NEGATIVE_INFINITY;
  R.POSITIVE_INFINITY=Number.POSITIVE_INFINITY;
  R.E_MAX_SAFE_INTEGER="e"+MAX_SAFE_INTEGER;
  R.EE_MAX_SAFE_INTEGER="ee"+MAX_SAFE_INTEGER;
  R.TETRATED_MAX_SAFE_INTEGER="10^^"+MAX_SAFE_INTEGER;
  P.absoluteValue=P.abs=function(){
    var x=this.clone();
    x.sign=1;
    return x;
  };
  Q.absoluteValue=Q.abs=function(x){
    return new OmegaNum(x).abs();
  };
  P.negate=P.neg=function (){
    var x=this.clone();
    x.sign=x.sign*-1;
    return x;
  };
  Q.negate=Q.neg=function (x){
    return new OmegaNum(x).neg();
  };
  P.compareTo=P.cmp=function (other){
    if (!(other instanceof OmegaNum)) other=new OmegaNum(other);
    if (isNaN(this.array[0])||isNaN(other.array[0])) return NaN;
    if (this.array[0]==Infinity&&other.array[0]!=Infinity) return this.sign;
    if (this.array[0]!=Infinity&&other.array[0]==Infinity) return -other.sign;
    if (this.array.length==1&&this.array[0]===0&&other.array.length==1&&other.array[0]===0) return 0;
    if (this.sign!=other.sign) return this.sign;
    var m=this.sign;
    var r;
    if (this.array.length>other.array.length) r=1;
    else if (this.array.length<other.array.length) r=-1;
    else{
      for (var i=this.array.length-1;i>=0;--i){
        if (this.array[i]>other.array[i]){
          r=1;
          break;
        }else if (this.array[i]<other.array[i]){
          r=-1;
          break;
        }
      }
      r=r||0;
    }
    return r*m;
  };
  Q.compare=Q.cmp=function (x,y){
    return new OmegaNum(x).cmp(y);
  };
  P.greaterThan=P.gt=function (other){
    return this.cmp(other)>0;
  };
  Q.greaterThan=Q.gt=function (x,y){
    return new OmegaNum(x).gt(y);
  };
  P.greaterThanOrEqualTo=P.gte=function (other){
    return this.cmp(other)>=0;
  };
  Q.greaterThanOrEqualTo=Q.gte=function (x,y){
    return new OmegaNum(x).gte(y);
  };
  P.lessThan=P.lt=function (other){
    return this.cmp(other)<0;
  };
  Q.lessThan=Q.lt=function (x,y){
    return new OmegaNum(x).lt(y);
  };
  P.lessThanOrEqualTo=P.lte=function (other){
    return this.cmp(other)<=0;
  };
  Q.lessThanOrEqualTo=Q.lte=function (x,y){
    return new OmegaNum(x).lte(y);
  };
  P.equalsTo=P.equal=P.eq=function (other){
    return this.cmp(other)===0;
  };
  Q.equalsTo=Q.equal=Q.eq=function (x,y){
    return new OmegaNum(x).eq(y);
  };
  P.notEqualsTo=P.notEqual=P.neq=function (other){
    return this.cmp(other)!==0;
  };
  Q.notEqualsTo=Q.notEqual=Q.neq=function (x,y){
    return new OmegaNum(x).neq(y);
  };
  P.minimum=P.min=function (other){
    return this.lt(other)?this.clone():new OmegaNum(other);
  };
  Q.minimum=Q.min=function (x,y){
    return new OmegaNum(x).min(y);
  };
  P.maximum=P.max=function (other){
    return this.gt(other)?this.clone():new OmegaNum(other);
  };
  Q.maximum=Q.max=function (x,y){
    return new OmegaNum(x).max(y);
  };
  P.isPositive=P.ispos=function (){
    return this.gt(OmegaNum.ZERO);
  };
  Q.isPositive=Q.ispos=function (x){
    return new OmegaNum(x).ispos();
  };
  P.isNegative=P.isneg=function (){
    return this.lt(OmegaNum.ZERO);
  };
  Q.isNegative=Q.isneg=function (x){
    return new OmegaNum(x).isneg();
  };
  P.isNaN=function (){
    return isNaN(this.array[0]);
  };
  Q.isNaN=function (x){
    return new OmegaNum(x).isNaN();
  };
  P.isFinite=function (){
    return isFinite(this.array[0]);
  };
  Q.isFinite=function (x){
    return new OmegaNum(x).isFinite();
  };
  P.isInfinite=function (){
    return this.array[0]==Infinity;
  };
  Q.isInfinite=function (x){
    return new OmegaNum(x).isInfinite();
  };
  P.isInteger=P.isint=function (){
    if (this.sign==-1) return this.abs().isint();
    if (this.gt(OmegaNum.MAX_SAFE_INTEGER)) return true;
    return Number.isInteger(this.toNumber());
  };
  Q.isInteger=Q.isint=function (x){
    return new OmegaNum(x).isint();
  };
  P.floor=function (){
    if (this.isInteger()) return this.clone();
    return new OmegaNum(Math.floor(this.toNumber()));
  };
  Q.floor=function (x){
    return new OmegaNum(x).floor();
  };
  P.ceiling=P.ceil=function (){
    if (this.isInteger()) return this.clone();
    return new OmegaNum(Math.ceil(this.toNumber()));
  };
  Q.ceiling=Q.ceil=function (x){
    return new OmegaNum(x).ceil();
  };
  P.round=function (){
    if (this.isInteger()) return this.clone();
    return new OmegaNum(Math.round(this.toNumber()));
  };
  Q.round=function (x){
    return new OmegaNum(x).round();
  };
  P.plus=P.add=function (other){
    var x=this.clone();
    other=new OmegaNum(other);
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(this+"+"+other);
    if (x.sign==-1) return x.neg().add(other.neg()).neg();
    if (other.sign==-1) return x.sub(other.neg());
    if (x.eq(OmegaNum.ZERO)) return other;
    if (other.eq(OmegaNum.ZERO)) return x;
    if (x.isNaN()||other.isNaN()||x.isInfinite()&&other.isInfinite()&&x.eq(other.neg())) return OmegaNum.NaN.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return other;
    var p=x.min(other);
    var q=x.max(other);
    var t;
    if (q.gt(OmegaNum.E_MAX_SAFE_INTEGER)||q.div(p).gt(OmegaNum.MAX_SAFE_INTEGER)){
      t=q;
    }else if (!q.array[1]){
      t=new OmegaNum(x.toNumber()+other.toNumber());
    }else if (q.array[1]==1){
      var a=p.array[1]?p.array[0]:Math.log10(p.array[0]);
      t=new OmegaNum([a+Math.log10(Math.pow(10,q.array[0]-a)+1),1]);
    }
    p=q=null;
    return t;
  };
  Q.plus=Q.add=function (x,y){
    return new OmegaNum(x).add(y);
  };
  P.minus=P.sub=function (other){
    var x=this.clone();
    other=new OmegaNum(other);
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(x+"-"+other);
    if (x.sign==-1) return x.neg().sub(other.neg()).neg();
    if (other.sign==-1) return x.add(other.neg());
    if (x.eq(other)) return OmegaNum.ZERO.clone();
    if (other.eq(OmegaNum.ZERO)) return x;
    if (x.isNaN()||other.isNaN()||x.isInfinite()&&other.isInfinite()) return OmegaNum.NaN.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return other.neg();
    var p=x.min(other);
    var q=x.max(other);
    var n=other.gt(x);
    var t;
    if (q.gt(OmegaNum.E_MAX_SAFE_INTEGER)||q.div(p).gt(OmegaNum.MAX_SAFE_INTEGER)){
      t=q;
      t=n?t.neg():t;
    }else if (!q.array[1]){
      t=new OmegaNum(x.toNumber()-other.toNumber());
    }else if (q.array[1]==1){
      var a=p.array[1]?p.array[0]:Math.log10(p.array[0]);
      t=new OmegaNum([a+Math.log10(Math.pow(10,q.array[0]-a)-1),1]);
      t=n?t.neg():t;
    }
    p=q=null;
    return t;
  };
  Q.minus=Q.sub=function (x,y){
    return new OmegaNum(x).sub(y);
  };
  P.times=P.mul=function (other){
    var x=this.clone();
    other=new OmegaNum(other);
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(x+"*"+other);
    if (x.sign*other.sign==-1) return x.abs().mul(other.abs()).neg();
    if (x.sign==-1) return x.abs().mul(other.abs());
    if (x.isNaN()||other.isNaN()||x.eq(OmegaNum.ZERO)&&other.isInfinite()||x.isInfinite()&&other.abs().eq(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
    if (other.eq(OmegaNum.ZERO)) return OmegaNum.ZERO.clone();
    if (other.eq(OmegaNum.ONE)) return x.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return other;
    if (x.max(other).gt(OmegaNum.EE_MAX_SAFE_INTEGER)) return x.max(other);
    var n=x.toNumber()*other.toNumber();
    if (n<=MAX_SAFE_INTEGER) return new OmegaNum(n);
    return OmegaNum.pow(10,x.log10().add(other.log10()));
  };
  Q.times=Q.mul=function (x,y){
    return new OmegaNum(x).mul(y);
  };
  P.divide=P.div=function (other){
    var x=this.clone();
    other=new OmegaNum(other);
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(x+"/"+other);
    if (x.sign*other.sign==-1) return x.abs().div(other.abs()).neg();
    if (x.sign==-1) return x.abs().div(other.abs());
    if (x.isNaN()||other.isNaN()||x.isInfinite()&&other.isInfinite()||x.eq(OmegaNum.ZERO)&&other.eq(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
    if (other.eq(OmegaNum.ZERO)) return OmegaNum.POSITIVE_INFINITY.clone();
    if (other.eq(OmegaNum.ONE)) return x.clone();
    if (x.eq(other)) return OmegaNum.ONE.clone();
    if (x.isInfinite()) return x;
    if (other.isInfinite()) return OmegaNum.ZERO.clone();
    if (x.max(other).gt(OmegaNum.EE_MAX_SAFE_INTEGER)) return x.gt(other)?x.clone():OmegaNum.ZERO.clone();
    var n=x.toNumber()/other.toNumber();
    if (n<=MAX_SAFE_INTEGER) return new OmegaNum(n);
    var pw=OmegaNum.pow(10,x.log10().sub(other.log10()));
    var fp=pw.floor();
    if (pw.sub(fp).lt(new OmegaNum(1e-9))) return fp;
    return pw;
  };
  Q.divide=Q.div=function (x,y){
    return new OmegaNum(x).div(y);
  };
  P.reciprocate=P.rec=function (){
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(this+"^-1");
    if (this.isNaN()||this.eq(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
    if (this.abs().gt("2e323")) return OmegaNum.ZERO.clone();
    return new OmegaNum(1/this);
  };
  Q.reciprocate=Q.rec=function (x){
    return new OmegaNum(x).rec();
  };
  P.modular=P.mod=function (other){
    other=new OmegaNum(other);
    if (other.eq(OmegaNum.ZERO)) return OmegaNum.ZERO.clone();
    if (this.sign*other.sign==-1) return this.abs().mod(other.abs()).neg();
    if (this.sign==-1) return this.abs().mod(other.abs());
    return this.sub(this.div(other).floor().mul(other));
  };
  Q.modular=Q.mod=function (x,y){
    return new OmegaNum(x).mod(y);
  };
  //All of these are from Patashu's break_eternity.js
  //from HyperCalc source code
  var f_gamma=function (n){
    if (!isFinite(n)) return n;
    if (n<-50){
      if (n==Math.trunc(n)) return Number.NEGATIVE_INFINITY;
      return 0;
    }
    var scal1=1;
    while (n<10){
      scal1=scal1*n;
      ++n;
    }
    n-=1;
    var l=0.9189385332046727; //0.5*Math.log(2*Math.PI)
    l+=(n+0.5)*Math.log(n);
    l-=n;
    var n2=n*n;
    var np=n;
    l+=1/(12*np);
    np*=n2;
    l+=1/(360*np);
    np*=np*n2;
    l+=1/(1260*np);
    np*=n2;
    l+=1/(1680*np);
    np*=n2;
    l+=1/(1188*np);
    np*=n2;
    l+=691/(360360*np);
    np*=n2;
    l+=7/(1092*np);
    np*=n2;
    l+=3617/(122400*np);
    return Math.exp(l)/scal1;
  };
  //from HyperCalc source code
  P.gamma=function (){
    var x=this.clone();
    if (x.gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)) return x;
    if (x.gt(OmegaNum.E_MAX_SAFE_INTEGER)) return OmegaNum.exp(x);
    if (x.gt(OmegaNum.MAX_SAFE_INTEGER)) return OmegaNum.exp(OmegaNum.mul(x,OmegaNum.ln(x).sub(1)));
    var n=x.array[0];
    if (n>1){
      if (n<24) return new OmegaNum(f_gamma(x.sign*n));
      var t=n-1;
      var l=0.9189385332046727; //0.5*Math.log(2*Math.PI)
      l+=((t+0.5)*Math.log(t));
      l-=t;
      var n2=t*t;
      var np=t;
      var lm=12*np;
      var adj=1/lm;
      var l2=l+adj;
      if (l2==l) return OmegaNum.exp(l);
      l=l2;
      np*=n2;
      lm=360*np;
      adj=1/lm;
      l2=l-adj;
      if (l2==l) return OmegaNum.exp(l);
      l=l2;
      np*=n2;
      lm=1260*np;
      var lt=1/lm;
      l+=lt;
      np*=n2;
      lm=1680*np;
      lt=1/lm;
      l-=lt;
      return OmegaNum.exp(l);
    }else return this.rec();
  };
  Q.gamma=function (x){
    return new OmegaNum(x).gamma();
  };
  //end break_eternity.js excerpt
  Q.factorials=[1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000, 121645100408832000, 2432902008176640000, 51090942171709440000, 1124000727777607680000, 25852016738884976640000, 620448401733239439360000, 15511210043330985984000000, 403291461126605635584000000, 10888869450418352160768000000, 304888344611713860501504000000, 8841761993739701954543616000000, 265252859812191058636308480000000, 8222838654177922817725562880000000, 263130836933693530167218012160000000, 8683317618811886495518194401280000000, 295232799039604140847618609643520000000, 10333147966386144929666651337523200000000, 371993326789901217467999448150835200000000, 13763753091226345046315979581580902400000000, 523022617466601111760007224100074291200000000, 20397882081197443358640281739902897356800000000, 815915283247897734345611269596115894272000000000, 33452526613163807108170062053440751665152000000000, 1405006117752879898543142606244511569936384000000000, 60415263063373835637355132068513997507264512000000000, 2658271574788448768043625811014615890319638528000000000, 119622220865480194561963161495657715064383733760000000000, 5502622159812088949850305428800254892961651752960000000000, 258623241511168180642964355153611979969197632389120000000000, 12413915592536072670862289047373375038521486354677760000000000, 608281864034267560872252163321295376887552831379210240000000000, 30414093201713378043612608166064768844377641568960512000000000000, 1551118753287382280224243016469303211063259720016986112000000000000, 80658175170943878571660636856403766975289505440883277824000000000000, 4274883284060025564298013753389399649690343788366813724672000000000000, 230843697339241380472092742683027581083278564571807941132288000000000000, 12696403353658275925965100847566516959580321051449436762275840000000000000, 710998587804863451854045647463724949736497978881168458687447040000000000000, 40526919504877216755680601905432322134980384796226602145184481280000000000000, 2350561331282878571829474910515074683828862318181142924420699914240000000000000, 138683118545689835737939019720389406345902876772687432540821294940160000000000000, 8320987112741390144276341183223364380754172606361245952449277696409600000000000000, 507580213877224798800856812176625227226004528988036003099405939480985600000000000000, 31469973260387937525653122354950764088012280797258232192163168247821107200000000000000, 1982608315404440064116146708361898137544773690227268628106279599612729753600000000000000, 126886932185884164103433389335161480802865516174545192198801894375214704230400000000000000, 8247650592082470666723170306785496252186258551345437492922123134388955774976000000000000000, 544344939077443064003729240247842752644293064388798874532860126869671081148416000000000000000, 36471110918188685288249859096605464427167635314049524593701628500267962436943872000000000000000, 2480035542436830599600990418569171581047399201355367672371710738018221445712183296000000000000000, 171122452428141311372468338881272839092270544893520369393648040923257279754140647424000000000000000, 11978571669969891796072783721689098736458938142546425857555362864628009582789845319680000000000000000, 850478588567862317521167644239926010288584608120796235886430763388588680378079017697280000000000000000, 61234458376886086861524070385274672740778091784697328983823014963978384987221689274204160000000000000000, 4470115461512684340891257138125051110076800700282905015819080092370422104067183317016903680000000000000000, 330788544151938641225953028221253782145683251820934971170611926835411235700971565459250872320000000000000000, 24809140811395398091946477116594033660926243886570122837795894512655842677572867409443815424000000000000000000, 1885494701666050254987932260861146558230394535379329335672487982961844043495537923117729972224000000000000000000, 145183092028285869634070784086308284983740379224208358846781574688061991349156420080065207861248000000000000000000, 11324281178206297831457521158732046228731749579488251990048962825668835325234200766245086213177344000000000000000000, 894618213078297528685144171539831652069808216779571907213868063227837990693501860533361810841010176000000000000000000, 71569457046263802294811533723186532165584657342365752577109445058227039255480148842668944867280814080000000000000000000, 5797126020747367985879734231578109105412357244731625958745865049716390179693892056256184534249745940480000000000000000000, 475364333701284174842138206989404946643813294067993328617160934076743994734899148613007131808479167119360000000000000000000, 39455239697206586511897471180120610571436503407643446275224357528369751562996629334879591940103770870906880000000000000000000, 3314240134565353266999387579130131288000666286242049487118846032383059131291716864129885722968716753156177920000000000000000000, 281710411438055027694947944226061159480056634330574206405101912752560026159795933451040286452340924018275123200000000000000000000, 24227095383672732381765523203441259715284870552429381750838764496720162249742450276789464634901319465571660595200000000000000000000, 2107757298379527717213600518699389595229783738061356212322972511214654115727593174080683423236414793504734471782400000000000000000000, 185482642257398439114796845645546284380220968949399346684421580986889562184028199319100141244804501828416633516851200000000000000000000, 16507955160908461081216919262453619309839666236496541854913520707833171034378509739399912570787600662729080382999756800000000000000000000, 1485715964481761497309522733620825737885569961284688766942216863704985393094065876545992131370884059645617234469978112000000000000000000000, 135200152767840296255166568759495142147586866476906677791741734597153670771559994765685283954750449427751168336768008192000000000000000000000, 12438414054641307255475324325873553077577991715875414356840239582938137710983519518443046123837041347353107486982656753664000000000000000000000, 1156772507081641574759205162306240436214753229576413535186142281213246807121467315215203289516844845303838996289387078090752000000000000000000000, 108736615665674308027365285256786601004186803580182872307497374434045199869417927630229109214583415458560865651202385340530688000000000000000000000, 10329978488239059262599702099394727095397746340117372869212250571234293987594703124871765375385424468563282236864226607350415360000000000000000000000, 991677934870949689209571401541893801158183648651267795444376054838492222809091499987689476037000748982075094738965754305639874560000000000000000000000, 96192759682482119853328425949563698712343813919172976158104477319333745612481875498805879175589072651261284189679678167647067832320000000000000000000000, 9426890448883247745626185743057242473809693764078951663494238777294707070023223798882976159207729119823605850588608460429412647567360000000000000000000000, 933262154439441526816992388562667004907159682643816214685929638952175999932299156089414639761565182862536979208272237582511852109168640000000000000000000000, 93326215443944152681699238856266700490715968264381621468592963895217599993229915608941463976156518286253697920827223758251185210916864000000000000000000000000, 9425947759838359420851623124482936749562312794702543768327889353416977599316221476503087861591808346911623490003549599583369706302603264000000000000000000000000, 961446671503512660926865558697259548455355905059659464369444714048531715130254590603314961882364451384985595980362059157503710042865532928000000000000000000000000, 99029007164861804075467152545817733490901658221144924830052805546998766658416222832141441073883538492653516385977292093222882134415149891584000000000000000000000000, 10299016745145627623848583864765044283053772454999072182325491776887871732475287174542709871683888003235965704141638377695179741979175588724736000000000000000000000000, 1081396758240290900504101305800329649720646107774902579144176636573226531909905153326984536526808240339776398934872029657993872907813436816097280000000000000000000000000, 114628056373470835453434738414834942870388487424139673389282723476762012382449946252660360871841673476016298287096435143747350528228224302506311680000000000000000000000000, 12265202031961379393517517010387338887131568154382945052653251412013535324922144249034658613287059061933743916719318560380966506520420000368175349760000000000000000000000000, 1324641819451828974499891837121832599810209360673358065686551152497461815091591578895743130235002378688844343005686404521144382704205360039762937774080000000000000000000000000, 144385958320249358220488210246279753379312820313396029159834075622223337844983482099636001195615259277084033387619818092804737714758384244334160217374720000000000000000000000000, 15882455415227429404253703127090772871724410234473563207581748318444567162948183030959960131517678520479243672638179990208521148623422266876757623911219200000000000000000000000000, 1762952551090244663872161047107075788761409536026565516041574063347346955087248316436555574598462315773196047662837978913145847497199871623320096254145331200000000000000000000000000, 197450685722107402353682037275992488341277868034975337796656295094902858969771811440894224355027779366597957338237853638272334919686385621811850780464277094400000000000000000000000000, 22311927486598136465966070212187151182564399087952213171022161345724023063584214692821047352118139068425569179220877461124773845924561575264739138192463311667200000000000000000000000000, 2543559733472187557120132004189335234812341496026552301496526393412538629248600474981599398141467853800514886431180030568224218435400019580180261753940817530060800000000000000000000000000, 292509369349301569068815180481773552003419272043053514672100535242441942363589054622883930786268803187059211939585703515345785120071002251720730101703194015956992000000000000000000000000000, 33931086844518982011982560935885732032396635556994207701963662088123265314176330336254535971207181169698868584991941607780111073928236261199604691797570505851011072000000000000000000000000000, 3969937160808720895401959629498630647790406360168322301129748464310422041758630649341780708631240196854767624444057168110272995649603642560353748940315749184568295424000000000000000000000000000, 468452584975429065657431236280838416439267950499862031533310318788629800927518416622330123618486343228862579684398745837012213486653229822121742374957258403779058860032000000000000000000000000000, 55745857612076058813234317117419771556272886109483581752463927935846946310374691578057284710599874844234646982443450754604453404911734348832487342619913750049708004343808000000000000000000000000000, 6689502913449127057588118054090372586752746333138029810295671352301633557244962989366874165271984981308157637893214090552534408589408121859898481114389650005964960521256960000000000000000000000000000, 809429852527344373968162284544935082997082306309701607045776233628497660426640521713391773997910182738287074185078904956856663439318382745047716214841147650721760223072092160000000000000000000000000000, 98750442008336013624115798714482080125644041369783596059584700502676714572050143649033796427745042294071023050579626404736512939596842694895821378210620013388054747214795243520000000000000000000000000000, 12146304367025329675766243241881295855454217088483382315328918161829235892362167668831156960612640202170735835221294047782591091570411651472186029519906261646730733907419814952960000000000000000000000000000, 1506141741511140879795014161993280686076322918971939407100785852066825250652908790935063463115967385069171243567440461925041295354731044782551067660468376444194611004520057054167040000000000000000000000000000, 188267717688892609974376770249160085759540364871492425887598231508353156331613598866882932889495923133646405445930057740630161919341380597818883457558547055524326375565007131770880000000000000000000000000000000, 23721732428800468856771473051394170805702085973808045661837377170052497697783313457227249544076486314839447086187187275319400401837013955325179315652376928996065123321190898603130880000000000000000000000000000000, 3012660018457659544809977077527059692324164918673621799053346900596667207618480809067860692097713761984609779945772783965563851033300772326297773087851869982500270661791244122597621760000000000000000000000000000000, 385620482362580421735677065923463640617493109590223590278828403276373402575165543560686168588507361534030051833058916347592172932262498857766114955245039357760034644709279247692495585280000000000000000000000000000000, 49745042224772874403902341504126809639656611137138843145968864022652168932196355119328515747917449637889876686464600208839390308261862352651828829226610077151044469167497022952331930501120000000000000000000000000000000, 6466855489220473672507304395536485253155359447828049608975952322944781961185526165512707047229268452925683969240398027149120740074042105844737747799459310029635780991774612983803150965145600000000000000000000000000000000, 847158069087882051098456875815279568163352087665474498775849754305766436915303927682164623187034167333264599970492141556534816949699515865660644961729169613882287309922474300878212776434073600000000000000000000000000000000, 111824865119600430744996307607616902997562475571842633838412167568361169672820118454045730260688510087990927196104962685462595837360336094267205134948250389032461924909766607715924086489297715200000000000000000000000000000000, 14872707060906857289084508911813048098675809251055070300508818286592035566485075754388082124671571841702793317081960037166525246368924700537538282948117301741317436012998958826217903503076596121600000000000000000000000000000000, 1992942746161518876737324194182948445222558439641379420268181650403332765909000151088003004705990626788174304488982644980314383013435909872030129915047718433336536425741860482713199069412263880294400000000000000000000000000000000, 269047270731805048359538766214698040105045389351586221736204522804449923397715020396880405635308734616403531106012657072342441706813847832724067538531441988500432417475151165166281874370655623839744000000000000000000000000000000000, 36590428819525486576897272205198933454286172951815726156123815101405189582089242773975735166401987907830880230417721361838572072126683305250473185240276110436058808776620558462614334914409164842205184000000000000000000000000000000000, 5012888748274991661034926292112253883237205694398754483388962668892510972746226260034675717797072343372830591567227826571884373881355612819314826377917827129740056802397016509378163883274055583382110208000000000000000000000000000000000, 691778647261948849222819828311491035886734385827028118707676848307166514238979223884785249055995983385450621636277440066920043595627074569065446040152660143904127838730788278294186615891819670506731208704000000000000000000000000000000000, 96157231969410890041971956135297253988256079629956908500367081914696145479218112119985149618783441690577636407442564169301886059792163365100096999581219760002673769583579570682891939608962934200435638009856000000000000000000000000000000000, 13462012475717524605876073858941615558355851148193967190051391468057460367090535696797920946629681836680869097041958983702264048370902871114013579941370766400374327741701139895604871545254810788060989321379840000000000000000000000000000000000, 1898143759076170969428526414110767793728175011895349373797246196996101911759765533248506853474785138972002542682916216702019230820297304827075914771733278062452780211579860725280286887880928321116599494314557440000000000000000000000000000000000, 269536413788816277658850750803729026709400851689139611079208959973446471469886705721287973193419489734024361060974102771686730776482217285444779897586125484868294790044340222989800738079091821598557128192667156480000000000000000000000000000000000, 38543707171800727705215657364933250819444321791546964384326881276202845420193798918144180166658987031965483631719296696351202501036957071818603525354815944336166154976340651887541505545310130488593669331551403376640000000000000000000000000000000000, 5550293832739304789551054660550388117999982337982762871343070903773209740507907044212761943998894132603029642967578724274573160149321818341878907651093495984407926316593053871805976798524658790357488383743402086236160000000000000000000000000000000000, 804792605747199194484902925779806277109997439007500616344745281047115412373646521410850481879839649227439298230298915019813108221651663659572441609408556917739149315905992811411866635786075524601835815642793302504243200000000000000000000000000000000000, 117499720439091082394795827163851716458059626095095089986332811032878850206552392125984170354456588787206137541623641592892713800361142894297576474973649309989915800122274950466132528824767026591868029083847822165619507200000000000000000000000000000000000, 17272458904546389112034986593086202319334765035978978227990923221833190980363201642519673042105118551719302218618675314155228928653088005461743741821126448568517622617974417718521481737240752909004600275325629858346067558400000000000000000000000000000000000, 2556323917872865588581178015776757943261545225324888777742656636831312265093753843092911610231557545654456728355563946494973881440657024808338073789526714388140608147460213822341179297111631430532680840748193219035217998643200000000000000000000000000000000000, 380892263763056972698595524350736933545970238573408427883655838887865527498969322620843829924502074302514052524979028027751108334657896696442372994639480443832950613971571859528835715269633083149369445271480789636247481797836800000000000000000000000000000000000, 57133839564458545904789328652610540031895535786011264182548375833179829124845398393126574488675311145377107878746854204162666250198684504466355949195922066574942592095735778929325357290444962472405416790722118445437122269675520000000000000000000000000000000000000, 8627209774233240431623188626544191544816225903687700891564804750810154197851655157362112747789971982951943289690774984828562603780001360174419748328584232052816331406456102618328128950857189333333217935399039885261005462721003520000000000000000000000000000000000000, 1311335885683452545606724671234717114812066337360530535517850322123143438073451583919041137664075741408695380032997797693941515774560206746511801745944803272028082373781327597985875600530292778666649126180654062559672830333592535040000000000000000000000000000000000000, 200634390509568239477828874698911718566246149616161171934231099284840946025238092339613294062603588435530393145048663047173051913507711632216305667129554900620296603188543122491838966881134795135997316305640071571629943041039657861120000000000000000000000000000000000000, 30897696138473508879585646703632404659201907040888820477871589289865505687886666220300447285640952619071680544337494109264649994680187591361311072737951454695525676891035640863743200899694758450943586711068571022031011228320107310612480000000000000000000000000000000000000, 4789142901463393876335775239063022722176295591337767174070096339929153381622433264146569329274347655956110484372311586936020749175429076661003216274382475477806479918110524333880196139452687559896255940215628508414806740389616633144934400000000000000000000000000000000000000, 747106292628289444708380937293831544659502112248691679154935029028947927533099589206864815366798234329153235562080607562019236871366935959116501738803666174537810867225241796085310597754619259343815926673638047312709851500780194770609766400000000000000000000000000000000000000, 117295687942641442819215807155131552511541831623044593627324799557544824622696635505477776012587322789677057983246655387237020188804608945581290772992175589402436306154362961985393763847475223716979100487761173428095446685622490578985733324800000000000000000000000000000000000000, 18532718694937347965436097530510785296823609396441045793117318330092082290386068409865488609988797000768975161352971551183449189831128213401843942132763743125584936372389347993692214687901085347282697877066265401639080576328353511479745865318400000000000000000000000000000000000000, 2946702272495038326504339507351214862194953894034126281105653614484641084171384877168612688988218723122267050655122476638168421183149385930893186799109435156968004883209906330997062135376272570217948962453536198860613811636208208325279592585625600000000000000000000000000000000000000, 471472363599206132240694321176194377951192623045460204976904578317542573467421580346978030238114995699562728104819596262106947389303901748942909887857509625114880781313585012959529941660203611234871833992565791817698209861793313332044734813700096000000000000000000000000000000000000000, 75907050539472187290751785709367294850142012310319093001281637109124354328254874435863462868336514307629599224875954998199218529677928181579808491945059049643495805791487187086484320607292781408814365272803092482649411787748723446459202305005715456000000000000000000000000000000000000000, 12296942187394494341101789284917501765723005994271693066207625211678145401177289658609880984670515317835995074429904709708273401807824365415928975695099566042246320538220924308010459938381430588227927174194100982189204709615293198326390773410925903872000000000000000000000000000000000000000, 2004401576545302577599591653441552787812849977066285969791842909503537700391898214353410600501293996807267197132074467682448564494675371562796423038301229264886150247730010662205704969956173185881152129393638460096840367667292791327201696065980922331136000000000000000000000000000000000000000, 328721858553429622726333031164414657201307396238870899045862237158580182864271307153959338482212215476391820329660212699921564577126760936298613378281401599441328640627721748601735615072812402484508949220556707455881820297436017777661078154820871262306304000000000000000000000000000000000000000, 54239106661315887749844950142128418438215720379413698342567269131165730172604765680403290849565015553604650354393935095487058155225915554489271207416431263907819225703574088519286376487014046409943976621391856730220500349076942933314077895545443758280540160000000000000000000000000000000000000000, 9003691705778437366474261723593317460743809582982673924866166675773511208652391102946946281027792581898371958829393225850851653767501982045219020431127589808697991466793298694201538496844331704050700119151048217216603057946772526930136930660543663874569666560000000000000000000000000000000000000000, 1503616514864999040201201707840084015944216200358106545452649834854176371844949314192140028931641361177028117124508668717092226179172831001551576411998307498052564574954480881931656928973003394576466919898225052275172710677111011997332867420310791867053134315520000000000000000000000000000000000000000, 252607574497319838753801886917134114678628321660161899636045172255501630469951484784279524860515748677740723676917456344471493998101035608260664837215715659672830848592352788164518364067464570288846442542901808782229015393754650015551921726612213033664926565007360000000000000000000000000000000000000000, 42690680090047052749392518888995665380688186360567361038491634111179775549421800928543239701427161526538182301399050122215682485679075017796052357489455946484708413412107621199803603527401512378815048789750405684196703601544535852628274771797464002689372589486243840000000000000000000000000000000000000000, 7257415615307998967396728211129263114716991681296451376543577798900561843401706157852350749242617459511490991237838520776666022565442753025328900773207510902400430280058295603966612599658257104398558294257568966313439612262571094946806711205568880457193340212661452800000000000000000000000000000000000000000];
  P.factorial=P.fact=function (){
    var x=this.clone();
    var f=OmegaNum.factorials;
    if (x.lt(OmegaNum.ZERO)||!x.isint()) return x.add(1).gamma();
    if (x.lte(170)) return new OmegaNum(f[+x]);
    var errorFixer=1;
    var e=+x;
    if (e<500) e+=163879/209018880*Math.pow(e,5);
    if (e<1000) e+=-571/2488320*Math.pow(e,4);
    if (e<50000) e+=-139/51840*Math.pow(e,3);
    if (e<1e7) e+=1/288*Math.pow(e,2);
    if (e<1e20) e+=1/12*e;
    return x.div(OmegaNum.E).pow(x).mul(x.mul(OmegaNum.PI).mul(2).sqrt()).times(errorFixer);
  };
  Q.factorial=Q.fact=function (x){
    return new OmegaNum(x).fact();
  };
  P.toPower=P.pow=function (other){
    other=new OmegaNum(other);
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(this+"^"+other);
    if (other.eq(OmegaNum.ZERO)) return OmegaNum.ONE.clone();
    if (other.eq(OmegaNum.ONE)) return this.clone();
    if (other.lt(OmegaNum.ZERO)) return this.pow(other.neg()).rec();
    if (this.lt(OmegaNum.ZERO)&&other.isint()){
      if (other.mod(2).lt(OmegaNum.ONE)) return this.abs().pow(other);
      return this.abs().pow(other).neg();
    }
    if (this.lt(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
    if (this.eq(OmegaNum.ONE)) return OmegaNum.ONE.clone();
    if (this.eq(OmegaNum.ZERO)) return OmegaNum.ZERO.clone();
    if (this.max(other).gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)) return this.max(other);
    if (this.eq(10)){
      if (other.gt(OmegaNum.ZERO)){
        other.array[1]=(other.array[1]+1)||1;
        other.standardize();
        return other;
      }else{
        return new OmegaNum(Math.pow(10,other.toNumber()));
      }
    }
    if (other.lt(OmegaNum.ONE)) return this.root(other.rec());
    var n=Math.pow(this.toNumber(),other.toNumber());
    if (n<=MAX_SAFE_INTEGER) return new OmegaNum(n);
    return OmegaNum.pow(10,this.log10().mul(other));
  };
  Q.toPower=Q.pow=function (x,y){
    return new OmegaNum(x).pow(y);
  };
  P.exponential=P.exp=function (){
    return OmegaNum.pow(Math.E,this);
  };
  Q.exponential=Q.exp=function (x){
    return OmegaNum.pow(Math.E,x);
  };
  P.squareRoot=P.sqrt=function (){
    return this.root(2);
  };
  Q.squareRoot=Q.sqrt=function (x){
    return new OmegaNum(x).root(2);
  };
  P.cubeRoot=P.cbrt=function (){
    return this.root(3);
  };
  Q.cubeRoot=Q.cbrt=function (x){
    return new OmegaNum(x).root(3);
  };
  P.root=function (other){
    other=new OmegaNum(other);
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(this+"root"+other);
    if (other.eq(OmegaNum.ONE)) return this.clone();
    if (other.lt(OmegaNum.ZERO)) return this.root(other.neg()).rec();
    if (other.lt(OmegaNum.ONE)) return this.pow(other.rec());
    if (this.lt(OmegaNum.ZERO)&&other.isint()&&other.mod(2).eq(OmegaNum.ONE)) return this.neg().root(other).neg();
    if (this.lt(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
    if (this.eq(OmegaNum.ONE)) return OmegaNum.ONE.clone();
    if (this.eq(OmegaNum.ZERO)) return OmegaNum.ZERO.clone();
    if (this.max(other).gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)) return this.gt(other)?this.clone():OmegaNum.ZERO.clone();
    return OmegaNum.pow(10,this.log10().div(other));
  };
  Q.root=function (x,y){
    return new OmegaNum(x).root(y);
  };
  P.generalLogarithm=P.log10=function (){
    var x=this.clone();
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log("log"+this);
    if (x.lt(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
    if (x.eq(OmegaNum.ZERO)) return OmegaNum.NEGATIVE_INFINITY.clone();
    if (x.lte(OmegaNum.MAX_SAFE_INTEGER)) return new OmegaNum(Math.log10(x.toNumber()));
    if (!x.isFinite()) return x;
    if (x.gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)) return x;
    x.array[1]--;
    return x.standardize();
  };
  Q.generalLogarithm=Q.log10=function (x){
    return new OmegaNum(x).log10();
  };
  P.logarithm=P.logBase=function (base){
    if (base===undefined) base=Math.E;
    return this.log10().div(OmegaNum.log10(base));
  };
  Q.logarithm=Q.logBase=function (x,base){
    return new OmegaNum(x).logBase(base);
  };
  P.naturalLogarithm=P.log=P.ln=function (){
    return this.logBase(Math.E);
  };
  Q.naturalLogarithm=Q.log=Q.ln=function (x){
    return new OmegaNum(x).ln();
  };
  //All of these are from Patashu's break_eternity.js
  var OMEGA=0.56714329040978387299997;  //W(1,0)
  //from https://math.stackexchange.com/a/465183
  //The evaluation can become inaccurate very close to the branch point
  var f_lambertw=function (z,tol){
    if (tol===undefined) tol=1e-10;
    var w;
    var wn;
    if (!Number.isFinite(z)) return z;
    if (z===0) return z;
    if (z===1) return OMEGA;
    if (z<10) w=0;
    else w=Math.log(z)-Math.log(Math.log(z));
    for (var i=0;i<100;++i){
      wn=(z*Math.exp(-w)+w*w)/(w+1);
      if (Math.abs(wn-w)<tol*Math.abs(wn)) return wn;
      w=wn;
    }
    throw Error("Iteration failed to converge: "+z);
    //return Number.NaN;
  };
  //from https://github.com/scipy/scipy/blob/8dba340293fe20e62e173bdf2c10ae208286692f/scipy/special/lambertw.pxd
  //The evaluation can become inaccurate very close to the branch point
  //at ``-1/e``. In some corner cases, `lambertw` might currently
  //fail to converge, or can end up on the wrong branch.
  var d_lambertw=function (z,tol){
    if (tol===undefined) tol=1e-10;
    z=new OmegaNum(z);
    var w;
    var ew, wewz, wn;
    if (!z.isFinite()) return z;
    if (z===0) return z;
    if (z===1){
      //Split out this case because the asymptotic series blows up
      return OMEGA;
    }
    //Get an initial guess for Halley's method
    w=OmegaNum.ln(z);
    //Halley's method; see 5.9 in [1]
    for (var i=0;i<100;++i){
      ew=OmegaNum.exp(-w);
      wewz=w.sub(z.mul(ew));
      wn=w.sub(wewz.div(w.add(OmegaNum.ONE).sub((w.add(2)).mul(wewz).div((OmegaNum.mul(2,w).add(2))))));
      if (OmegaNum.abs(wn.sub(w)).lt(OmegaNum.abs(wn).mul(tol))) return wn;
      w = wn;
    }
    throw Error("Iteration failed to converge: "+z);
    //return Decimal.dNaN;
  };
  //The Lambert W function, also called the omega function or product logarithm, is the solution W(x) === x*e^x.
  //https://en.wikipedia.org/wiki/Lambert_W_function
  //Some special values, for testing: https://en.wikipedia.org/wiki/Lambert_W_function#Special_values
  P.lambertw=function (){
    var x=this.clone();
    if (x.isNaN()) return x;
    if (x.lt(-0.3678794411710499)) throw Error("lambertw is unimplemented for results less than -1, sorry!");
    if (x.gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)) return x;
    if (x.gt(OmegaNum.EE_MAX_SAFE_INTEGER)){
      x.array[1]--;
      return x;
    }
    if (x.gt(OmegaNum.MAX_SAFE_INTEGER)) return d_lambertw(x);
    else return new OmegaNum(f_lambertw(x.sign*x.array[0]));
  };
  Q.lambertw=function (x){
    return new OmegaNum(x).lambertw();
  };
  //end break_eternity.js excerpt
  //Uses linear approximations for real height
  P.tetrate=P.tetr=function (other,payload){
    if (payload===undefined) payload=OmegaNum.ONE;
    var t=this.clone();
    other=new OmegaNum(other);
    payload=new OmegaNum(payload);
    if (payload.neq(OmegaNum.ONE)) other=other.add(payload.slog(t));
    if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(t+"^^"+other);
    var negln;
    if (t.isNaN()||other.isNaN()||payload.isNaN()) return OmegaNum.NaN.clone();
    if (other.isInfinite()&&other.sign>0){
      if (t.gte(Math.exp(1/Math.E))) return OmegaNum.POSITIVE_INFINITY.clone();
      //Formula for infinite height power tower.
      negln = t.ln().neg();
      return negln.lambertw().div(negln);
    }
    if (other.lte(-2)) return OmegaNum.NaN.clone();
    if (t.eq(OmegaNum.ZERO)){
      if (other.eq(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
      if (other.mod(2).eq(OmegaNum.ZERO)) return OmegaNum.ZERO.clone();
      return OmegaNum.ONE.clone();
    }
    if (t.eq(OmegaNum.ONE)){
      if (other.eq(OmegaNum.ONE.neg())) return OmegaNum.NaN.clone();
      return OmegaNum.ONE.clone();
    }
    if (other.eq(OmegaNum.ONE.neg())) return OmegaNum.ZERO.clone();
    if (other.eq(OmegaNum.ZERO)) return OmegaNum.ONE.clone();
    if (other.eq(OmegaNum.ONE)) return t;
    if (other.eq(2)) return t.pow(t);
    if (t.eq(2)){
      if (other.eq(3)) return new OmegaNum(16);
      if (other.eq(4)) return new OmegaNum(65536);
    }
    var m=t.max(other);
    if (m.gt("10^^^"+MAX_SAFE_INTEGER)) return m;
    if (m.gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)||other.gt(OmegaNum.MAX_SAFE_INTEGER)){
      if (this.lt(Math.exp(1/Math.E))){
        negln = t.ln().neg();
        return negln.lambertw().div(negln);
      }
      var j=t.slog(10).add(other);
      j.array[2]=(other.array[2]||0)+1;
      j.standardize();
      return j;
    }
    var y=other.toNumber();
    var f=Math.floor(y);
    var r=t.pow(y-f);
    var l=OmegaNum.NaN;
    for (var i=0,m=OmegaNum.E_MAX_SAFE_INTEGER;f!==0&&r.lt(m)&&i<100;++i){
      if (f>0){
        r=t.pow(r);
        if (l.eq(r)){
          f=0;
          break;
        }
        l=r;
        --f;
      }else{
        r=r.logBase(t);
        if (l.eq(r)){
          f=0;
          break;
        }
        l=r;
        ++f;
      }
    }
    if (i==100||this.lt(Math.exp(1/Math.E))) f=0;
    r.array[1]=(r.array[1]+f)||f;
    r.standardize();
    return r;
  };
  Q.tetrate=Q.tetr=function (x,y,payload){
    return new OmegaNum(x).tetr(y,payload);
  };
  //Implementation of functions from break_eternity.js
  P.iteratedexp=function (other,payload){
    return this.tetr(other,payload);
  };
  Q.iteratedexp=function (x,y,payload){
    return new OmegaNum(x).iteratedexp(other,payload);
  };
  //This implementation is highly inaccurate and slow, and probably be given custom code
  P.iteratedlog=function (base,other){
    if (base===undefined) base=10;
    if (other===undefined) other=OmegaNum.ONE.clone();
    var t=this.clone();
    if (other.eq(ExpantaNum.ZERO)) return t;
    if (other.eq(ExpantaNum.ONE)) return t.logBase(base);
    base=new OmegaNum(base);
    other=new OmegaNum(other);
    return base.tetr(t.slog(base).sub(other));
  };
  Q.iteratedlog=function (x,y,z){
    return new OmegaNum(x).iteratedlog(y,z);
  };
  P.layeradd=function (other,base){
    if (base===undefined) base=10;
    if (other===undefined) other=OmegaNum.ONE.clone();
    var t=this.clone();
    base=new OmegaNum(base);
    other=new OmegaNum(other);
    return base.tetr(t.slog(base).add(other));
  };
  Q.layeradd=function (x,y,z){
    return new OmegaNum(x).layeradd(y,z);
  };
  P.layeradd10=function (other){
    return this.layeradd(other);
  };
  Q.layeradd10=function (x,y){
    return new OmegaNum(x).layeradd10(y);
  };
  //End implementation from break_eternity.js
  //All of these are from Patashu's break_eternity.js
  //The super square-root function - what number, tetrated to height 2, equals this?
  //Other sroots are possible to calculate probably through guess and check methods, this one is easy though.
  //https://en.wikipedia.org/wiki/Tetration#Super-root
  P.ssqrt=P.ssrt=function (){
    var x=this.clone();
    if (x.lt(Math.exp(-1/Math.E))) return OmegaNum.NaN.clone();
    if (!x.isFinite()) return x;
    if (x.gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)) return x;
    if (x.gt(OmegaNum.EE_MAX_SAFE_INTEGER)){
      x.array[1]--;
      return x;
    }
    var l=x.ln();
    return l.div(l.lambertw());
  };
  Q.ssqrt=Q.ssrt=function (x){
    return new OmegaNum(x).ssqrt();
  };
  //Super-logarithm, one of tetration's inverses, tells you what size power tower you'd have to tetrate base to to get number. By definition, will never be higher than 1.8e308 in break_eternity.js, since a power tower 1.8e308 numbers tall is the largest representable number.
  //Uses linear approximation
  //https://en.wikipedia.org/wiki/Super-logarithm
  P.slog=function (base){
    if (base===undefined) base=10;
    var x=new OmegaNum(this);
    base=new OmegaNum(base);
    if (x.isNaN()||base.isNaN()||x.isInfinite()&&base.isInfinite()) return OmegaNum.NaN.clone();
    if (x.isInfinite()) return x;
    if (base.isInfinite()) return OmegaNum.ZERO.clone();
    if (x.lt(OmegaNum.ZERO)) return OmegaNum.ONE.neg();
    if (x.eq(OmegaNum.ONE)) return OmegaNum.ZERO.clone();
    if (x.eq(base)) return OmegaNum.ONE.clone();
    if (base.lt(Math.exp(1/Math.E))){
      var a=OmegaNum.tetr(base,Infinity);
      if (x.eq(a)) return OmegaNum.POSITIVE_INFINITY.clone();
      if (x.gt(a)) return OmegaNum.NaN.clone();
    }
    if (x.max(base).gt("10^^^"+MAX_SAFE_INTEGER)){
      if (x.gt(base)) return x;
      return OmegaNum.ZERO.clone();
    }
    if (x.max(base).gt(OmegaNum.TETRATED_MAX_SAFE_INTEGER)){
      if (x.gt(base)){
        x.array[2]--;
        x.standardize();
        return x.sub(x.array[1]);
      }
      return OmegaNum.ZERO.clone();
    }
    var r=0;
    var t=(x.array[1]||0)-(base.array[1]||0);
    if (t>3){
      var l=t-3;
      r+=l;
      x.array[1]=x.array[1]-l;
    }
    for (var i=0;i<100;++i){
      if (x.lt(OmegaNum.ZERO)){
        x=OmegaNum.pow(base,x);
        --r;
      }else if (x.lte(1)){
        return new OmegaNum(r+x.toNumber()-1);
      }else{
        ++r;
        x=OmegaNum.logBase(x,base);
      }
    }
    if (x.gt(10))
    return new OmegaNum(r);
  };
  Q.slog=function (x,y){
    return new OmegaNum(x).slog(y);
  };
  //end break_eternity.js excerpt
  P.pentate=P.pent=function (other){
    return this.arrow(3)(other);
  };
  Q.pentate=Q.pent=function (x,y){
    return OmegaNum.arrow(x,3,y);
  };
  //Uses linear approximations for real height
  P.arrow=function (arrows){
    var t=this.clone();
    arrows=new OmegaNum(arrows);
    if (!arrows.isint()||arrows.lt(OmegaNum.ZERO)) return function(other){return OmegaNum.NaN.clone();};
    if (arrows.eq(OmegaNum.ZERO)) return function(other){return t.mul(other);};
    if (arrows.eq(OmegaNum.ONE)) return function(other){return t.pow(other);};
    if (arrows.eq(2)) return function(other){return t.tetr(other);};
    return function (other){
      other=new OmegaNum(other);
      if (OmegaNum.debug>=OmegaNum.NORMAL) console.log(t+"{"+arrows+"}"+other);
      if (other.lt(OmegaNum.ZERO)) return OmegaNum.NaN.clone();
      if (other.eq(OmegaNum.ZERO)) return OmegaNum.ONE.clone();
      if (other.eq(OmegaNum.ONE)) return t.clone();
      if (arrows.gte(OmegaNum.maxArrow)){
        console.warn("Number too large to reasonably handle it: tried to "+arrows.add(2)+"-ate.");
        return OmegaNum.POSITIVE_INFINITY.clone();
      }
      if (other.eq(2)) return t.arrow(arrows-1)(t);
      if (t.max(other).gt("10{"+arrows.add(OmegaNum.ONE)+"}"+MAX_SAFE_INTEGER)) return t.max(other);
      var r;
      if (t.gt("10{"+arrows+"}"+MAX_SAFE_INTEGER)||other.gt(OmegaNum.MAX_SAFE_INTEGER)){
        if (t.gt("10{"+arrows+"}"+MAX_SAFE_INTEGER)){
          r=t.clone();
          r.array[arrows]--;
          r.standardize();
        }else if (t.gt("10{"+arrows.sub(OmegaNum.ONE)+"}"+MAX_SAFE_INTEGER)){
          r=new OmegaNum(t.array[arrows.sub(OmegaNum.ONE)]);
        }else{
          r=OmegaNum.ZERO;
        }
        var j=r.add(other);
        j.array[arrows]=(other.array[arrows]||0)+1;
        j.standardize();
        return j;
      }
      var y=other.toNumber();
      var f=Math.floor(y);
      r=t.arrow(arrows.sub(1))(y-f);
      for (var i=0,m=new OmegaNum("10{"+arrows.sub(OmegaNum.ONE)+"}"+MAX_SAFE_INTEGER);f!==0&&r.lt(m)&&i<100;++i){
        if (f>0){
          r=t.arrow(arrows.sub(OmegaNum.ONE))(r);
          --f;
        }
      }
      if (i==100) f=0;
      r.array[arrows.sub(OmegaNum.ONE)]=(r.array[arrows.sub(OmegaNum.ONE)]+f)||f;
      r.standardize();
      return r;
    };
  };
  P.chain=function (other,arrows){
    return this.arrow(arrows)(other);
  };
  Q.arrow=function (x,z,y){
    return new OmegaNum(x).arrow(z)(y);
  };
  Q.chain=function (x,y,z){
    return new OmegaNum(x).arrow(z)(y);
  };
  Q.hyper=function (z){
    z=new OmegaNum(z);
    if (z.eq(OmegaNum.ZERO)) return function(x,y){return new OmegaNum(y).eq(OmegaNum.ZERO)?new OmegaNum(x):new OmegaNum(x).add(OmegaNum.ONE);};
    if (z.eq(OmegaNum.ONE)) return function(x,y){return OmegaNum.add(x,y);};
    return function(x,y){return new OmegaNum(x).arrow(z.sub(2))(y);};
  };
  // All of these are from Patashu's break_eternity.js
  Q.affordGeometricSeries = function (resourcesAvailable, priceStart, priceRatio, currentOwned) {
    /*
      If you have resourcesAvailable, the price of something starts at
      priceStart, and on each purchase it gets multiplied by priceRatio,
      and you have already bought currentOwned, how many of the object
      can you buy.
    */
    resourcesAvailable=new OmegaNum(resourcesAvailable);
    priceStart=new OmegaNum(priceStart);
    priceRatio=new OmegaNum(priceRatio);
    var actualStart = priceStart.mul(priceRatio.pow(currentOwned));
    return OmegaNum.floor(resourcesAvailable.div(actualStart).mul(priceRatio.sub(OmegaNum.ONE)).add(OmegaNum.ONE).log10().div(priceRatio.log10()));
  };
  Q.affordArithmeticSeries = function (resourcesAvailable, priceStart, priceAdd, currentOwned) {
    /*
      If you have resourcesAvailable, the price of something starts at
      priceStart, and on each purchase it gets increased by priceAdd,
      and you have already bought currentOwned, how many of the object
      can you buy.
    */
    resourcesAvailable=new OmegaNum(resourcesAvailable);
    priceStart=new OmegaNum(priceStart);
    priceAdd=new OmegaNum(priceAdd);
    currentOwned=new OmegaNum(currentOwned);
    var actualStart = priceStart.add(currentOwned.mul(priceAdd));
    var b = actualStart.sub(priceAdd.div(2));
    var b2 = b.pow(2);
    return b.neg().add(b2.add(priceAdd.mul(resourcesAvailable).mul(2)).sqrt()).div(priceAdd).floor();
  };
  Q.sumGeometricSeries = function (numItems, priceStart, priceRatio, currentOwned) {
    /*
      If you want to buy numItems of something, the price of something starts at
      priceStart, and on each purchase it gets multiplied by priceRatio,
      and you have already bought currentOwned, what will be the price of numItems
      of something.
    */
    priceStart=new OmegaNum(priceStart);
    priceRatio=new OmegaNum(priceRatio);
    return priceStart.mul(priceRatio.pow(currentOwned)).mul(OmegaNum.sub(OmegaNum.ONE, priceRatio.pow(numItems))).div(OmegaNum.sub(OmegaNum.ONE, priceRatio));
  };
  Q.sumArithmeticSeries = function (numItems, priceStart, priceAdd, currentOwned) {
    /*
      If you want to buy numItems of something, the price of something starts at
      priceStart, and on each purchase it gets increased by priceAdd,
      and you have already bought currentOwned, what will be the price of numItems
      of something.
    */
    numItems=new OmegaNum(numItems);
    priceStart=new OmegaNum(priceStart);
    currentOwned=new OmegaNum(currentOwned);
    var actualStart = priceStart.add(currentOwned.mul(priceAdd));

    return numItems.div(2).mul(actualStart.mul(2).plus(numItems.sub(OmegaNum.ONE).mul(priceAdd)));
  };
  // Binomial Coefficients n choose k
  Q.choose = function (n, k) {
    /*
      If you have n items and you take k out,
      how many ways could you do this?
    */
    return new OmegaNum(n).factorial().div(new OmegaNum(k).factorial().mul(new OmegaNum(n).sub(new OmegaNum(k)).factorial()));
  };
  P.choose = function (other) {
    return OmegaNum.choose(this, other);
  };
  //end break_eternity.js excerpt
  P.standardize=function (){
    var b;
    var x=this;
    if (OmegaNum.debug>=OmegaNum.ALL) console.log(x.toString());
    if (!x.array||!x.array.length) x.array=[0];
    if (x.sign!=1&&x.sign!=-1){
      if (typeof x.sign!="number") x.sign=Number(x.sign);
      x.sign=x.sign<0?-1:1;
    }
    for (var l=x.array.length,i=0;i<l;i++){
      var e=x.array[i];
      if (e===null||e===undefined){
        x.array[i]=0;
        continue;
      }
      if (isNaN(e)){
        x.array=[NaN];
        return x;
      }
      if (!isFinite(e)){
        x.array=[Infinity];
        return x;
      }
      if (i!==0&&!Number.isInteger(e)) x.array[i]=Math.floor(e);
    }
    do{
      if (OmegaNum.debug>=OmegaNum.ALL) console.log(x.toString());
      b=false;
      while (x.array.length&&x.array[x.array.length-1]===0){
        x.array.pop();
        b=true;
      }
      if (x.array[0]>MAX_SAFE_INTEGER){
        x.array[1]=(x.array[1]||0)+1;
        x.array[0]=Math.log10(x.array[0]);
        b=true;
      }
      while (x.array[0]<MAX_E&&x.array[1]){
        x.array[0]=Math.pow(10,x.array[0]);
        x.array[1]--;
        b=true;
      }
      if (x.array.length>2&&!x.array[1]){
        for (i=2;!x.array[i];++i) continue;
        x.array[i-1]=x.array[0];
        x.array[0]=1;
        x.array[i]--;
        b=true;
      }
      for (l=x.array.length,i=1;i<l;++i){
        if (x.array[i]>MAX_SAFE_INTEGER){
          x.array[i+1]=(x.array[i+1]||0)+1;
          x.array[0]=x.array[i]+1;
          for (var j=1;j<=i;++j) x.array[j]=0;
          b=true;
        }
      }
    }while(b);
    if (!x.array.length) x.array=[0];
    return x;
  };
  P.toNumber=function (){
    //console.log(this.array);
    if (this.sign==-1) return -1*this.abs();
    if (this.array.length>=2&&(this.array[1]>=2||this.array[1]==1&&this.array[0]>Math.log10(Number.MAX_VALUE))) return Infinity;
    if (this.array[1]==1) return Math.pow(10,this.array[0]);
    return this.array[0];
  };
  P.toString=function (){
    if (this.sign==-1) return "-"+this.abs();
    if (isNaN(this.array[0])) return "NaN";
    if (!isFinite(this.array[0])) return "Infinity";
    var s="";
    if (this.array.length>=2){
      for (var i=this.array.length-1;i>=2;--i){
        var q=i>=5?"{"+i+"}":"^".repeat(i);
        if (this.array[i]>1) s+="(10"+q+")^"+this.array[i]+" ";
        else if (this.array[i]==1) s+="10"+q;
      }
    }
    if (!this.array[1]) s+=String(this.toNumber());
    else if (this.array[1]<3) s+="e".repeat(this.array[1]-1)+Math.pow(10,this.array[0]-Math.floor(this.array[0]))+"e"+Math.floor(this.array[0]);
    else if (this.array[1]<8) s+="e".repeat(this.array[1])+this.array[0];
    else s+="(10^)^"+this.array[1]+" "+this.array[0];
    return s;
  };
  //from break_eternity.js
  var decimalPlaces=function decimalPlaces(value,places){
    var len=places+1;
    var numDigits=Math.ceil(Math.log10(Math.abs(value)));
    var rounded=Math.round(value*Math.pow(10,len-numDigits))*Math.pow(10,numDigits-len);
    return parseFloat(rounded.toFixed(Math.max(len-numDigits,0)));
  };
  P.toStringWithDecimalPlaces=function (places,applyToOpNums){
    if (this.sign==-1) return "-"+this.abs();
    if (isNaN(this.array[0])) return "NaN";
    if (!isFinite(this.array[0])) return "Infinity";
    var b=0;
    var s="";
    var m=Math.pow(10,places);
    if (this.array.length>=2){
      for (var i=this.array.length-1;!b&&i>=2;--i){
        var x=this.array[i];
        if (applyToOpNums&&x>=m){
          ++i;
          b=x;
          x=1;
        }else if (applyToOpNums&&this.array[i-1]>=m){
          ++x;
          b=this.array[i-1];
        }
        var q=i>=5?"{"+i+"}":"^".repeat(i);
        if (x>1) s+="(10"+q+")^"+x+" ";
        else if (x==1) s+="10"+q;
      }
    }
    var k=this.array[0];
    var l=this.array[1]||0;
    if (k>m){
      k=Math.log10(k);
      ++l;
    }
    if (b) s+=decimalPlaces(b,places);
    else if (!l) s+=String(decimalPlaces(k,places));
    else if (l<3) s+="e".repeat(l-1)+decimalPlaces(Math.pow(10,k-Math.floor(k)),places)+"e"+decimalPlaces(Math.floor(k),places);
    else if (l<8) s+="e".repeat(l)+decimalPlaces(k,places);
    else if (applyToOpNums) s+="(10^)^"+decimalPlaces(l,places)+" "+decimalPlaces(k,places);
    else s+="(10^)^"+l+" "+decimalPlaces(k,places);
    return s;
  };
  //these are from break_eternity.js as well
  P.toExponential=function (places,applyToOpNums){
    if (this.array.length==1) return (this.sign*this.array[0]).toExponential(places);
    return this.toStringWithDecimalPlaces(places,applyToOpNums);
  };
  P.toFixed=function (places,applyToOpNums){
    if (this.array.length==1) return (this.sign*this.array[0]).toFixed(places);
    return this.toStringWithDecimalPlaces(places,applyToOpNums);
  };
  P.toPrecision=function (places,applyToOpNums){
    if (this.array[0]===0) return (this.sign*this.array[0]).toFixed(places-1,applyToOpNums);
    if (this.array.length==1&&this.array[0]<1e-6) return this.toExponential(places-1,applyToOpNums);
    if (this.array.length==1&&places>Math.log10(this.array[0])) return this.toFixed(places-Math.floor(Math.log10(this.array[0]))-1,applyToOpNums);
    return this.toExponential(places-1,applyToOpNums);
  };
  P.valueOf=function (){
    return this.toString();
  };
  //Note: toArray() would be impossible without changing the layout of the array or lose the information about the sign
  P.toJSON=function (){
    if (OmegaNum.serializeMode==OmegaNum.JSON){
      return {
        array:this.array.slice(0),
        sign:this.sign
      };
    }else if (OmegaNum.serializeMode==OmegaNum.STRING){
      return this.toString();
    }
  };
  P.toHyperE=function (){
    if (this.sign==-1) return "-"+this.abs().toHyperE();
    if (isNaN(this.array[0])) return "NaN";
    if (!isFinite(this.array[0])) return "Infinity";
    if (this.lt(OmegaNum.MAX_SAFE_INTEGER)) return String(this.array[0]);
    if (this.lt(OmegaNum.E_MAX_SAFE_INTEGER)) return "E"+this.array[0];
    var r="E"+this.array[0]+"#"+this.array[1];
    for (var i=2;i<this.array.length;++i){
      r+="#"+(this.array[i]+1);
    }
    return r;
  };
  Q.fromNumber=function (input){
    if (typeof input!="number") throw Error(invalidArgument+"Expected Number");
    var x=new OmegaNum();
    x.array[0]=Math.abs(input);
    x.sign=input<0?-1:1;
    x.standardize();
    return x;
  };
  Q.fromString=function (input){
    if (typeof input!="string") throw Error(invalidArgument+"Expected String");
    var isJSON=false;
    if (typeof input=="string"&&(input[0]=="["||input[0]=="{")){
      try {
        JSON.parse(input);
      }finally{
        isJSON=true;
      }
    }
    if (isJSON){
      return OmegaNum.fromJSON(input);
    }
    var x=new OmegaNum();
    x.array=[0];
    if (!isOmegaNum.test(input)){
      console.warn(omegaNumError+"Malformed input: "+input);
      x.array=[NaN];
      return x;
    }
    var negateIt=false;
    if (input[0]=="-"||input[0]=="+"){
      var numSigns=input.search(/[^-\+]/);
      var signs=input.substring(0,numSigns);
      negateIt=signs.match(/-/g).length%2==1;
      input=input.substring(numSigns);
    }
    if (input=="NaN") x.array=[NaN];
    else if (input=="Infinity") x.array=[Infinity];
    else{
      var a,b,c,d,i;
      while (input){
        if (/^\(?10[\^\{]/.test(input)){
          if (input[0]=="("){
            input=input.substring(1);
          }
          var arrows;
          if (input[2]=="^"){
            a=input.substring(2).search(/[^\^]/);
            arrows=a;
            b=a+2;
          }else{
            a=input.indexOf("}");
            arrows=Number(input.substring(3,a));
            b=a+1;
          }
          if (arrows>=OmegaNum.maxArrow){
            console.warn("Number too large to reasonably handle it: tried to "+arrows.add(2)+"-ate.");
            x.array=[Infinity];
            break;
          }
          input=input.substring(b);
          if (input[0]==")"){
            a=input.indexOf(" ");
            c=Number(input.substring(2,a));
            input=input.substring(a+1);
          }else{
            c=1;
          }
          if (arrows==1){
            x.array[1]=(x.array[1]||0)+c;
          }else if (arrows==2){
            a=x.array[1]||0;
            b=x.array[0]||0;
            if (b>=1e10) ++a;
            if (b>=10) ++a;
            x.array[0]=a;
            x.array[1]=0;
            x.array[2]=(x.array[2]||0)+c;
          }else{
            a=x.array[arrows-1]||0;
            b=x.array[arrows-2]||0;
            if (b>=10) ++a;
            for (i=1;i<arrows;++i){
              x.array[i]=0;
            }
            x.array[0]=a;
            x.array[arrows]=(x.array[arrows]||0)+c;
          }
        }else{
          break;
        }
      }
      a=input.split(/[Ee]/);
      b=[x.array[0],0];
      c=1;
      for (i=a.length-1;i>=0;--i){
        if (a[i]) d=Number(a[i]);
        else d=1;
        //The things that are already there
        if (b[0]<MAX_E&&b[1]===0){
          b[0]=Math.pow(10,c*b[0]);
        }else if (c==-1){
          if (b[1]===0){
            b[0]=Math.pow(10,c*b[0]);
          }else if (b[1]==1&&b[0]<=Math.log10(Number.MAX_VALUE)){
            b[0]=Math.pow(10,c*Math.pow(10,b[0]));
          }else{
            b[0]=0;
          }
          b[1]=0;
        }else{
          b[1]++;
        }
        //Multiplying coefficient
        if (b[1]===0){
          b[0]*=Number(d);
        }else if (b[1]==1){
          b[0]+=Math.log10(Number(d));
        }else if (b[1]==2&&b[0]<MAX_E+Math.log10(Math.log10(Number(d)))){
          b[0]+=Math.log10(1+Math.pow(10,Math.log10(Math.log10(Number(d)))-b[0]));
        }
        //Carrying
        if (b[0]<MAX_E&&b[1]){
          b[0]=Math.pow(10,b[0]);
          b[1]--;
        }else if (b[0]>MAX_SAFE_INTEGER){
          b[0]=Math.log10(b[0]);
          b[1]++;
        }
      }
      x.array[0]=b[0];
      x.array[1]=(x.array[1]||0)+b[1];
    }
    if (negateIt) x.sign*=-1;
    x.standardize();
    return x;
  };
  Q.fromArray=function (input1,input2){
    var array,sign;
    if (input1 instanceof Array&&(input2===undefined||typeof input2=="number")){
      array=input1;
      sign=input2;
    }else if (input2 instanceof Array&&typeof input1=="number"){
      array=input2;
      sign=input1;
    }else{
      throw Error(invalidArgument+"Expected an Array [and Boolean]");
    }
    var x=new OmegaNum();
    x.array=array.slice(0);
    if (sign) x.sign=Number(sign);
    else x.sign=1;
    x.standardize();
    return x;
  };
  Q.fromObject=function (input){
    if (typeof input!="object") throw Error(invalidArgument+"Expected Object");
    if (input===null) return OmegaNum.ZERO.clone();
    if (input instanceof Array) return OmegaNum.fromArray(input);
    if (input instanceof OmegaNum) return new OmegaNum(input);
    if (!(input.array instanceof Array)) throw Error(invalidArgument+"Expected that property 'array' exists");
    if (input.sign!==undefined&&typeof input.sign!="number") throw Error(invalidArgument+"Expected that property 'sign' is Number");
    var x=new OmegaNum();
    x.array=input.array.slice(0);
    x.sign=Number(input.sign)||1;
    x.standardize();
    return x;
  };
  Q.fromJSON=function (input){
    if (typeof input=="object") return OmegaNum.fromObject(parsedObject);
    if (typeof input!="string") throw Error(invalidArgument+"Expected String");
    var parsedObject,x;
    try{
      parsedObject=JSON.parse(input);
    }catch(e){
      parsedObject=null;
      throw e;
    }finally{
      x=OmegaNum.fromObject(parsedObject);
    }
    parsedObject=null;
    return x;
  };
  Q.fromHyperE=function (input){
    if (typeof input!="string") throw Error(invalidArgument+"Expected String");
    var x=new OmegaNum();
    x.array=[0];
    if (!/^[-\+]*(0|[1-9]\d*(\.\d*)?|Infinity|NaN|E[1-9]\d*(\.\d*)?(#[1-9]\d*)*)$/.test(input)){
      console.warn(omegaNumError+"Malformed input: "+input);
      x.array=[NaN];
      return x;
    }
    var negateIt=false;
    if (input[0]=="-"||input[0]=="+"){
      var numSigns=input.search(/[^-\+]/);
      var signs=input.substring(0,numSigns);
      negateIt=signs.match(/-/g).length%2===0;
      input=input.substring(numSigns);
    }
    if (input=="NaN") x.array=[NaN];
    else if (input=="Infinity") x.array=[Infinity];
    else if (input[0]!="E"){
      x.array[0]=Number(input);
    }else if (input.indexOf("#")==-1){
      x.array[0]=Number(input.substring(1));
      x.array[1]=1;
    }else{
      var array=input.substring(1).split("#");
      for (var i=0;i<array.length;++i){
        var t=Number(array[i]);
        if (i>=2){
          --t;
        }
        x.array[i]=t;
      }
    }
    if (negateIt) x.sign*=-1;
    x.standardize();
    return x;
  };
  P.clone=function (){
    var temp=new OmegaNum();
    temp.array=this.array.slice(0);
    temp.sign=this.sign;
    return temp;
  };
  // OmegaNum methods

  /*
   *  clone
   *  config/set
   */

  /*
   * Create and return a OmegaNum constructor with the same configuration properties as this OmegaNum constructor.
   *
   */
  function clone(obj) {
    var i, p, ps;
    function OmegaNum(input,input2) {
      var x=this;
      if (!(x instanceof OmegaNum)) return new OmegaNum(input,input2);
      x.constructor=OmegaNum;
      var parsedObject=null;
      if (typeof input=="string"&&(input[0]=="["||input[0]=="{")){
        try {
          parsedObject=JSON.parse(input);
        }catch(e){
          //lol just keep going
        }
      }
      var temp,temp2;
      if (typeof input=="number"&&!(input2 instanceof Array)){
        temp=OmegaNum.fromNumber(input);
      }else if (parsedObject){
        temp=OmegaNum.fromObject(parsedObject);
      }else if (typeof input=="string"&&input[0]=="E"){
        temp=OmegaNum.fromHyperE(input);
      }else if (typeof input=="string"){
        temp=OmegaNum.fromString(input);
      }else if (input instanceof Array||input2 instanceof Array){
        temp=OmegaNum.fromArray(input,input2);
      }else if (input instanceof OmegaNum){
        temp=input.array.slice(0);
        temp2=input.sign;
      }else if (typeof input=="object"){
        temp=OmegaNum.fromObject(input);
      }else{
        temp=[NaN];
        temp2=1;
      }
      if (typeof temp2=="undefined"){
        x.array=temp.array;
        x.sign=temp.sign;
      }else{
        x.array=temp;
        x.sign=temp2;
      }
      return x;
    }
    OmegaNum.prototype = P;

    OmegaNum.JSON = 0;
    OmegaNum.STRING = 1;
    
    OmegaNum.NONE = 0;
    OmegaNum.NORMAL = 1;
    OmegaNum.ALL = 2;

    OmegaNum.clone=clone;
    OmegaNum.config=OmegaNum.set=config;
    
    //OmegaNum=Object.assign(OmegaNum,Q);
    for (var prop in Q){
      if (Q.hasOwnProperty(prop)){
        OmegaNum[prop]=Q[prop];
      }
    }
    
    if (obj === void 0) obj = {};
    if (obj) {
      ps = ['maxArrow', 'serializeMode', 'debug'];
      for (i = 0; i < ps.length;) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
    }

    OmegaNum.config(obj);
    
    return OmegaNum;
  }

  function defineConstants(obj){
    for (var prop in R){
      if (R.hasOwnProperty(prop)){
        if (Object.defineProperty){
          Object.defineProperty(obj,prop,{
            configurable: false,
            enumerable: true,
            writable: false,
            value: new OmegaNum(R[prop])
          });
        }else{
          obj[prop]=new OmegaNum(R[prop]);
        }
      }
    }
    return obj;
  }

  /*
   * Configure global settings for a OmegaNum constructor.
   *
   * `obj` is an object with one or more of the following properties,
   *
   *   precision  {number}
   *   rounding   {number}
   *   toExpNeg   {number}
   *   toExpPos   {number}
   *
   * E.g. OmegaNum.config({ precision: 20, rounding: 4 })
   *
   */
  function config(obj){
    if (!obj||typeof obj!=='object') {
      throw Error(omegaNumError+'Object expected');
    }
    var i,p,v,
      ps = [
        'maxArrow',1,Number.MAX_SAFE_INTEGER,
        'serializeMode',0,1,
        'debug',0,2
      ];
    for (i = 0; i < ps.length; i += 3) {
      if ((v = obj[p = ps[i]]) !== void 0) {
        if (Math.floor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
        else throw Error(invalidArgument + p + ': ' + v);
      }
    }

    return this;
  }


  // Create and configure initial OmegaNum constructor.
  OmegaNum=clone(OmegaNum);

  OmegaNum=defineConstants(OmegaNum);

  OmegaNum['default']=OmegaNum.OmegaNum=OmegaNum;

  // Export.

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () {
      return OmegaNum;
    });
  // Node and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = OmegaNum;
    // Browser.
  } else {
    if (!globalScope) {
      globalScope = typeof self != 'undefined' && self && self.self == self
        ? self : Function('return this')();
    }
    globalScope.OmegaNum = OmegaNum;
  }
})(this);

function importSave(imported = undefined, forced = false) {
	if (imported === undefined)
		imported = prompt("Paste your save here");
	try {
		let z = atob(imported)
			while(z.indexOf('{"array')!==-1){
z=z.substring(0,z.indexOf('{"array'))+ExpantaNum(new OmegaNum(z.slice(z.indexOf('{"array'),z.indexOf('{"array')+z.slice(z.indexOf('{"array')).indexOf("}")+1)).toString()).toString()+z.slice(z.indexOf('{"array')+z.slice(z.indexOf('{"array')).indexOf("}")+1)
}
		
		tempPlr = Object.assign(getStartPlayer(), JSON.parse(z));
		if (tempPlr.versionType != modInfo.id && !forced && !confirm("This save appears to be for a different mod! Are you sure you want to import?")) // Wrong save (use "Forced" to force it to accept.)
			return;
		player = tempPlr;
		player.versionType = modInfo.id;
		fixSave();
		versionCheck();
		save();
		window.location.reload();
	} catch (e) {
		return;
	}
}
function versionCheck() {
	let setVersion = true;

	if (player.versionType === undefined || player.version === undefined) {
		player.versionType = modInfo.id;
		player.version = 0;
	}

	if (setVersion) {
		if (player.versionType == modInfo.id && VERSION.num > player.version) {
			player.keepGoing = false;
			if (fixOldSave)
				fixOldSave(player.version);
		}
		player.versionType = getStartPlayer().versionType;
		player.version = VERSION.num;
		player.beta = VERSION.beta;
	}
}
var saveInterval = setInterval(function () {
	if (player === undefined)
		return;
	if (gameEnded && !player.keepGoing)
		return;
	if (player.autosave)
		save();
}, 5000);
