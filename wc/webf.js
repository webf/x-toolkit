/*

 webf is a simple web components library.
 Copyright (C) 2012 Giuseppe Vallesi

 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

 contact: webf@portablehtml.com

 */

if (!String.prototype.trim) {
    String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
    String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};
    String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};
    String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};
}

<!-- Listen for the HTMLImportsLoaded event -->
function webf_extends(trg){
    function isFunction(f) {
        var getType = {};
        return f && getType.toString.call(f) === '[object Function]';
    }

    for (var key in trg){
        var dontOverride=key.charAt(0)=='_' && key.charAt(1)=='_';

        if (dontOverride){
            var ref=trg[key];
            delete trg[key];
            trg[key.substring(1)]=ref;
            ref._dont_override_=1
        }
    }

    if (!trg._wrapped_) trg._wrapped_={};
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src) for (var key in src){
          if (key.charAt(0) && key.charAt(key.length-1)=='_') continue;
          var dontOverride=key.charAt(0)=='_' && key.charAt(1)=='_';
          var ref=src[key];

          if (dontOverride){
              key=key.substring(1);
              ref._dont_override_=1;
          }

          function assign(f,key,src){
              if (src && src._wrapped_ && src._wrapped_[key]){
                  if (!trg._wrapped_[key])trg._wrapped_[key]=[  ];
                  for (var j = 0; j < src._wrapped_[key].length; j++) {
                      if (webf_indexOf(trg._wrapped_[key],src._wrapped_[key][j], function(a,b){ return a.ft== b.ft; })==-1)
                        trg._wrapped_[key].push(src._wrapped_[key][j]);
                      //trg._wrapped_[key][src._wrapped_[key][j][ft]]=src._wrapped_[key][j];
                  }
                  return ;
              } else {
                  if (!trg._wrapped_[key])
                      trg[key]=f;
                      //trg._wrapped_[key]=[  ];
                  else
                  //  trg._wrapped_[key][src._wrapped_[key][trg.name]]=src._wrapped_[key][j];
                    trg._wrapped_[key].push( {f:f, key: key, ft: src ? src.name : ""} );
              }
          }

          if (!trg[key]){
              assign(ref,key,src)
              //trg[key]=ref;
          } else {
              if (isFunction(trg[key]) ){
                  if (trg[key]._dont_override_) continue;

                  function propagateReturn(returned){
                      if (typeof returned != 'undefined' && typeof returned.p != 'undefined'){

                      } else {
                          switch (returned){
                              case -1: returned={p:false, r:false}; break;
                              case -2: returned={p:false, r:true}; break;
                              default:
                                  returned={p:true, r:returned}; break;
                          }
                      }
                      return returned;
                  }
                  function niceReturn(returned){
                      if (typeof returned != 'undefined' && typeof returned.p != 'undefined'){
                          returned=returned.r;
                      } else {
                          switch (returned){
                              case -1: returned=false; break;
                              case -2: returned=true; break;
                              default:
                                  break;
                          }
                      }
                      return returned;
                  }

                  function wrap0(_original, _fn) {
                      //if (!_original||!_fn)
                      //webf_log("f");
                      var original=new Function("","var f=arguments[0]; return function(){ return f.apply(this,arguments); };");
                      original=original(_original);
                      var fn=new Function("","var f=arguments[0]; return function(){ return f.apply(this,arguments); };");
                      fn=fn(_fn);
                      //original =_original;
                      //fn =_fn;

                      //original = (function(f){
                      //    return function(){ return f.apply(this,arguments); };
                      //})(_original);
                      //fn = (function(f){
                      //    return function(){ return f.apply(this,arguments); };
                      //})(_fn);
                      //if (!original||!fn)
                      //    webf_log("f");


                      original.ret=niceReturn;
                      if (original.original){
                          original.original.ret=propagateReturn;
                      }
                      fn.ret=niceReturn;
                      var f=function(){
                          var args = xtag.toArray(arguments),
                              returned=propagateReturn(original.apply(this, args));
                          if (!returned.p)
                              return original.ret(returned);

                          if (returned.pa)
                              returned=propagateReturn(fn.apply(this,typeof returned != 'undefined' ? xtag.toArray(returned) : args));
                          returned=propagateReturn(fn.apply(this,args));

                          return original.ret(returned);
                      };

                      //original.trg=trg;
                      //fn.trg=trg;

                      f.original=original;
                      f.fn=fn;

                      f._original=_original;
                      f._fn=_fn;
                      f.ft=src.name;
                      f._wrap_id=_wrap_id++;
                      return f;
                  }
                  function wrap(original, fn) {
                      var f=function(){
                          webf_log("[0]run "+original.ft+"."+key)
                          var args = xtag.toArray(arguments), returned=propagateReturn(original.apply(this, args));
                          if (!returned.p)
                              return propagateReturn(returned);

                          //webf_log("[1]run "+fn.ft+"."+key)
                          if (returned.pa)
                              returned=propagateReturn(fn.apply(this,typeof returned != 'undefined' ? xtag.toArray(returned) : args));
                          returned=propagateReturn(fn.apply(this,args));

                          return propagateReturn(returned);
                      };
                      f.original=original;
                      f.fn=fn;
                      f.ft=src.name;

                      return f;
                  }
                  //trg[key].ft=trg.name;

                  //webf_log("---WRAP "+key+" by "+trg.name)
                  //wrapped[key]=wrap(ref,trg[key]);
                  //trg[key]=wrapped[key];

                  function w(f,key,ft){
                      return function(){
                          xtag.toArray(arguments);
                          //webf_log("run "+key+" "+ft)
                          return propagateReturn(f.apply(this, xtag.toArray(arguments)));
                      }
                  }

                  if (!trg._wrapped_[key]){
                      trg._wrapped_[key]=[  ];
                      //if (src._wrapped_ && src._wrapped_[key]){
                      //    for (var j = 0; j < src._wrapped_[key].length; j++) {
                      //        trg._wrapped_[key].push(src._wrapped_[key][j]);
                      //    }
                      //} else
                          //trg._wrapped_[key].push({f:ref, key: key});
                      assign(ref,key,src)
                  }

                  //if (src._wrapped_ && src._wrapped_[key]){
                  //    for (var j = 0; j < src._wrapped_[key].length; j++) {
                  //        trg._wrapped_[key].push(src._wrapped_[key][j]);
                  //    }
                  //} else {
                  assign(trg[key],key);
                  //    trg._wrapped_[key].push( {f:trg[key], key: key, ft: trg.name} );
                  //}

                  trg[key]=(function(arr){
                      return function(){
                          var args=xtag.toArray(arguments);
                          for (var j = 0; j <arr.length ; j++) {
                          //for (var j = arr.length-1; j >=0 ; j--) {
                              //var s=""; for (var k = 0; k < rix; k++) s+=' ';
                              //rix++;
                              //webf_log(s+"run["+j+"/"+(arr.length-1)+"] "+arr[j].key+" "+arr[j].ft);
                              var returned=propagateReturn(arr[j].f.apply(this, args));
                              //webf_log(s+"run["+j+"/"+(arr.length-1)+"] "+arr[j].key+" "+arr[j].ft,returned);
                              //rix--;
                              if (!returned.p)
                                    break;
                                  //return niceReturn(returned);
                          }
                          return niceReturn(returned);
                      }
                  })(trg._wrapped_[key]);
                  trg[key].wp=trg._wrapped_[key];

              }
          }
          if (trg._wrapped_[key]){
              for (var k in trg._wrapped_[key]) {
                    var obj = trg._wrapped_[key][k];
                    if (obj.wp)
                        throw new Error("Inner wrap");
              }
          }
          //throw new Exception("Inner wrap");
      }
    }

    return trg;
}

function webf_debug(e){
    webf_log("Break point "+e);

}
function webf_log(){
    if (console && console.log)
        console.log.apply(this, arguments);

}

function webf_chainedFunctions(arr){
    //if (arr.length==1) return arr[0];

    function propagateReturn(returned){
        if (returned  && typeof returned.p != 'undefined'){

        } else {
            switch (returned){
                case -1: returned={p:false, r:false}; break;
                case -2: returned={p:false, r:true}; break;
                default:
                    returned={p:true, r:returned}; break;
            }
        }
        return returned;
    }
    function niceReturn(returned){
        if (typeof returned != 'undefined' && typeof returned.p != 'undefined'){
            returned=returned.r;
        } else {
            switch (returned){
                case -1: returned=false; break;
                case -2: returned=true; break;
                default:
                    break;
            }
        }
        return returned;
    }

    var f= function(){
            var args=xtag.toArray(arguments);
        var debug_arr=[];
            for (var j = 0; j <arr.length ; j++) {
                //for (var j = arr.length-1; j >=0 ; j--) {
                //var s=""; for (var k = 0; k < rix; k++) s+=' ';
                //rix++;
                //webf_log(s+"run["+j+"/"+(arr.length-1)+"] "+arr[j].key+" "+arr[j].ft);
                //if (!arr[j].f)
                //    webf_log("aa")
                try {
                    if (arr[j].f._dont_override_) return niceReturn(propagateReturn(arr[j].f.apply(this, args)));

                    var returned=propagateReturn(arr[j].f.apply(this, args));
                    //webf_log(s+"run["+j+"/"+(arr.length-1)+"] "+arr[j].key+" "+arr[j].ft,returned);
                    //rix--;
                    debug_arr.push("Calling["+j+"] "+ arr[j].key+" "+arr[j].ft+" "+returned.p+" "+returned.r);

                    if (!returned.p)
                        break;

                } catch (e){
                    webf_log("Error executing ",e,arr[j])
                }

                //return niceReturn(returned);
            }
            if (this.getAttribute("debug"))
                webf_log(this.getAttribute("debug")+"    "+debug_arr.join("->"))
            return niceReturn(returned);
        }
    f.wp=arr;
    return f;
}

function webf_extendFunction(f,f1,ft,dontOverride,before,after){
    var tentry={f:f1, key: name, ft: ft, nOverride: dontOverride};

    if (!f) return webf_chainedFunctions([
        tentry
    ]);
    if (f.wp){
        if (before!==null) for (var i = 0; i < f.wp.length; i++) if (f.wp[i]===before||before===i) arr.splice(i, 0, tentry);
        if (after!==null)  for (var i = 0; i < f.wp.length; i++) if ((f.wp[i]===after||after===i)) arr.splice(i+1, 0, tentry);
        else f.wp.push( tentry );
        return f;
    } else {
        return webf_chainedFunctions([
            {f:f, key: "?", ft: "?", nOverride: 0},
            tentry
        ]);
    }
}

function webf_extends_methods(trg){
    function isFunction(f) {
        var getType = {};
        return f && getType.toString.call(f) === '[object Function]';
    }

    for (var key in trg){
        var dontOverride=key.charAt(0)=='_' && key.charAt(1)=='_';

        if (dontOverride){
            var ref=trg[key];
            delete trg[key];
            trg[key.substring(1)]=ref;
            ref._dont_override_=1
        }
    }

    var isAlreadyWrapped=trg._wrapped_;
    if (!isAlreadyWrapped) trg._wrapped_={};

    function isSame(a,b){
        return a.ft== b.ft;
    }

    for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        if (src) for (var key in src){
            if (key.charAt(0) && key.charAt(key.length-1)=='_') continue;
            if (!isFunction(src[key]) ) continue;
            var dontOverride=key.charAt(0)=='_' && key.charAt(1)=='_';
            var isAlreadyWrapped=trg._wrapped_[key];
            var ref=src[key];

            if (dontOverride){

                key=key.substring(1);
                ref._dont_override_=1;
                    //trg._wrapped_[key]=[];
            }
            if (trg[key] && trg[key]._dont_override_){
                continue;
            }

            if (!trg._wrapped_[key]) trg._wrapped_[key]=[];

            // copio i wrapped
            if (src._wrapped_ && src._wrapped_[key]){
                for (var j = 0; j < src._wrapped_[key].length; j++)
                    webf_push(trg._wrapped_[key], src._wrapped_[key][j], isSame);
                    //trg._wrapped_[key].push(src._wrapped_[key][j]);
            } else {
                webf_push(trg._wrapped_[key],  {f:ref, key: key, ft: src.name}, isSame);
                //trg._wrapped_[key].push( {f:ref, key: key, ft: src.name} );
            }

            if (!isAlreadyWrapped && trg[key])
                webf_push(trg._wrapped_[key], {f:trg[key], key: key, ft: trg.name, nOverride: dontOverride}, isSame);
                //trg._wrapped_[key].push( {f:trg[key], key: key, ft: trg.name, nOverride: dontOverride} );

            trg[key]= webf_chainedFunctions(trg._wrapped_[key]);
            //trg[key].wp=trg._wrapped_[key];
            /*
            if (trg._wrapped_[key]){
                for (var k in trg._wrapped_[key]) {
                    var obj = trg._wrapped_[key][k];
                    if (obj.wp)
                        throw new Error("Inner wrap");
                }
            }*/
        }
    }

    return trg;
}

var rix=0;

_wrap_id=0;
function webf_indexOf(arr,obj){
    for (var i = 0; i < arr.length; i++) {
        if (arr[i]==obj) return i;
    }
    return -1;
}
function webf_indexOf(arr,obj,f){
    if (f) for (var i = 0; i < arr.length; i++){
        if (f(arr[i],obj))
            return i;
    }
    else for (var i = 0; i < arr.length; i++)
            if (arr[i]===obj)
                return i;
    return -1;
}

function webf_push(arr,obj,f){
    if (webf_indexOf(arr,obj,f)==-1) arr.push(obj);
}

function webf_features(trg){
    var args=arguments;

    trg.events = trg.events ? trg.events : {};
    trg.accessors = trg.accessors ? trg.accessors : {};
    trg.methods = trg.methods ? trg.methods : {};

    for (var i = 1; i < args.length; i++){
        trg.events = webf_extends(trg.events,args[i].events);
    }
    for (var i = 1; i < args.length; i++){
        trg.accessors = webf_extends(trg.accessors,args[i].accessors);
    }

    if (trg.apply_before) trg.methods._apply_before=trg.apply_before;
    if (trg.apply_build) trg.methods._apply_build=trg.apply_build;
    if (trg.apply_after) trg.methods._apply_after=trg.apply_after;
    if (trg.apply_after_insert) trg.methods._apply_after_insert=trg.apply_after_insert;
    if (trg.apply_after_remove) trg.methods._apply_after_remove=trg.apply_after_remove;
    if (trg.apply_after_change) trg.methods._apply_after_change=trg.apply_after_change;

    trg.methods.name=trg.name;
    for (var i = 1; i < args.length; i++) {
        //webf_log("webf_features "+args[i].name+" "+trg.name)
        args[i].methods.name=args[i].name
        trg.methods = webf_extends_methods(trg.methods,args[i].methods);
    }

    trg.methods._features=function(ix){
        var res=true;
        switch (ix){
            case -1:
                if (this._apply_before) try {
                    res=!this._apply_before.apply(this,arguments);
                } catch (e){
                    webf_log(e);
                }
                //for (var i = 1; i < args.length; i++)
                //    if (args[i].apply_before)
                //        res=!args[i].apply_before.apply(this,arguments);
                break;
            case 0:

                //for (var i = 1; i < args.length; i++)
                //    if (args[i].apply_build)
                //        res=!args[i].apply_build.apply(this,arguments);
                break;
            case 1:
                if (this._apply_after) try {
                    res=!this._apply_after.apply(this,arguments);
                } catch (e){
                    webf_log(e);
                }
                break;
            case 2:
                if (this._apply_after_insert) try {
                    res=!this._apply_after_insert.apply(this,arguments);
                } catch (e){
                    webf_log(e);
                }
                break;
            case 3:
                if (this._apply_after_remove) try {
                    res=!this._apply_after_remove.apply(this,arguments);
                } catch (e){
                    webf_log(e);
                }
                break;
            case 4:
                if (this._apply_after_change) try {
                    res=!this._apply_after_change.apply(this,arguments);
                } catch (e){
                    webf_log(e);
                }
                break;
        }
        // propagate
        return res;
    }


    /*
trg.methods = webf_extends_methods(trg.methods,{
    name: trg.name+"_FEATURE_IMPL",
        _features: function(ix){
            var res=true;
            switch (ix){
                case -1:
                    //for (var i = 1; i < args.length; i++)
                    //    if (args[i].apply_before)
                    //        res=!args[i].apply_before.apply(this,arguments);
                    break;
                case 0:
                    //for (var i = 1; i < args.length; i++)
                    //    if (args[i].apply_build)
                    //        res=!args[i].apply_build.apply(this,arguments);
                    break;
                case 1:
                    if (this._apply_after)
                        res=!this._apply_after.apply(this,arguments);
                    //if (trg.apply_after)
                    //    res=!trg.apply_after.apply(this,arguments);

                    //for (var i = 1; i < args.length; i++)
                    //    if (args[i].apply_after)
                    //        res=!args[i].apply_after.apply(this,arguments);
                    break;
            }
            // propagate
            return res;
        }
    });*/
    //webf_log(trg.name,trg);
    return trg;
}

var WEBF_FEATURE=function(name){
    return webf_features({
        name: "_"+name,
        methods: {
            _featureList: function(arr){ arr.push(name); return arr; },
            __findParentWC: function(s, node){
                var p= node.__parent ? node.__parent : node.parentNode;
                while (p){
                    if (p._hasFeature && p._hasFeature(s)) return p;
                    p=p.__parent ? p.__parent : p.parentNode;
                }
                return false;
            },
            _hasFeature: function(s){
                //webf_log("has feature "+s+" ? "+name);
                if (s==name) return -2;
            },
            __hasParentFeature: function(s){
                var p= this.__parent ? this.__parent : this.parentNode;
                return p._hasFeature && p._hasFeature(s) ? p : null;
            },
            __hasAscendantFeature: function(s){
                var p= this.__parent ? this.__parent : this.parentNode;
                while (p){
                    if (p._hasFeature && p._hasFeature(s)) return p;
                    p=p.__parent ? p.__parent : p.parentNode;
                }
                return false;
            },
            __getAscendantFeature: function(s){
                var arr=[];
                var p=this.__parent ? this.__parent : this.parentNode;
                while (p){
                    if (p._hasFeature && p._hasFeature(s)) arr.push(p);
                    p=p.__parent ? p.__parent : p.parentNode;
                }
                return arr;
            },
            __hasDescendantFeature: function(s){
                function hasF(self, s){
                    for (var i = 0; i < self._components.length; i++) {
                      var e = self._components[i];
                        if (e._hasFeature){
                            if (e._hasFeature(s) || hasF(e, s, arr)) return true;
                        }
                    }
                    return false;
                }
                return hasF(this, s);
                //return $("."+s,this).length>0;
            },
            __getDescendantFeature: function(s){
                var arr=[];
                function hasF(self, s, arr){
                    for (var i = 0; i < self._components.length; i++) {
                        var e = self._components[i];
                        if (e._hasFeature){
                            if (e._hasFeature(s) || hasF(e, s, arr)) arr.push(e);
                        }
                    }
                }
                hasF(this, s, arr);
                return $(arr);
                //return $("."+s,this);
            },
            __getAllDescendantFeature: function(s){
                var arr=[];
                function hasF(self, s, arr){
                    for (var i = 0; i < self._components.length; i++) {
                        var e = self._components[i];
                        if (e._hasFeature){
                            if (e._hasFeature(s)) arr.push(e);
                            hasF(e, s, arr);
                        }
                    }
                }
                hasF(this, s, arr);
                return $(arr);
                //return $("."+s,this);
            },
            __hasChildrenFeature: function(s){
                function hasF(self, s){
                    for (var i = 0; i < self._components.length; i++) {
                        var e = self._components[i];
                        if (e._hasFeature){
                            if (e._hasFeature(s)) return true;
                        }
                    }
                    return false;
                }
                return hasF(this, s);

                //return $(this).children("."+s).length>0;
            },
            __getChildrenFeature: function(s){
                var arr=[];
                function hasF(self, s, arr){
                    for (var i = 0; i < self._components.length; i++) {
                        var e = self._components[i];
                        if (e._hasFeature){
                            if (e._hasFeature(s)) arr.push(e);
                        }
                    }
                }
                hasF(this, s, arr);
                return $(arr);

                //return $(this).children("."+s);
            },
            __getRuntimeChildrenFeature: function(s){
                return $(this).children("."+s);
            }
        },
        /**
         * if return -1 stop propagation and return false
         * if return 2 stop propagation and return true
         * if return { p: false, r: x} stop propagation and return x
         *
         * otherwhise propagate
         */
        apply_before: function(){},
        /**
         * if return -1 stop propagation
         */
        apply_build: function(){},
        /**
         * if return -1 stop propagation
         */
        apply_after: function(){
            //this.addClass(this._webfImpl,name);
            this.addClass(this,name);
        }
    });
};
var WEBF_HIDE_FEATURE=function(name){
    return {
        methods: {
            _hasFeature: function(s){
                //webf_log("has feature "+s+" ? "+name);
                if (s==name) return -1;
            },
        },
    }
};

/****
 * todo: format, date, currency,checks
 *
 *
 *
 * @type {*}
 */
var WEBF_I18N=webf_features({
    name: "WEBF_I18N",

    methods: {
        __getKeys: function(lang){ return document._i18nMngr._getKeys(lang); },
        __addKeys: function(keys, lang){ document._i18nMngr._addKeys(keys, lang); },
        __addKey: function(key, value, lang){ document._i18nMngr._addKey(key, value, lang); },

        __i18n: function(){
            var keys = this._getKeys(this.getAttribute("lang"));
            var args=xtag.toArray(arguments);
            for (var i = 0; i < args.length; i++) {
              if (args[i])
                  if (keys[args[i]]) return keys[args[i]];
            }
            return args[ args.length-1];
        },
        __i18N: function(str,alt){
            var keys = this._getKeys(this.getAttribute("lang"));
            return str ? str : keys[alt];
        }
    },
    apply_before: function(){

        if (!document._i18nMngr)
            document._i18nMngr=document.createElement("webf_i18n_manager");

        var content = this.querySelectorAll("i18n");
        for (var j = 0; j < content.length; j++) {
            var e1 = content[j];
            var id= e1.id;
            var d=JSON.parse(e1.textContent);
            this._addKeys(d,e1.getAttribute("lang"));
        }

        // should load some how
        /*this._i18nKeys={
            // g-dialog-2
            "Search": "Search",
            "searchIcon": "//ssl.gstatic.com/ui/v1/button/search-white.png",
            "Go Back":"Go Back",
            "Previous":"Previous",
            "Expand":"Expand",
            "Minimize":"Minimize",
            "Close Dialog":"Close Dialog"
        };*/
    }
},WEBF_FEATURE("WEBF_I18N"));


/**
 * Manages components container. Allow Components to have subcomponents
 *
 * todo: manage runtime insert and remove
 *
 * whenever a component is found inside a WEBF_CONTAINER, it is append to his parent
 *
 * */
var WEBF_CONTAINER=webf_features({
    name: "WEBF_CONTAINER",

    methods: {

        /***
         * I can come here i to different stage if the component is created and if not
         *
         * in the first case I just add unless a WEBF_ITEM is inside a non WEBF_ITEM_CONTAINER in this case I store the item
         * if I add a WEBF_ITEM_CONTAINER, I will also add items.
         *
         *
         *
         *
         *
         * @param child
         * @private
         */
        __childAdded: function(child){
            if (this.getAttribute("debug")) webf_debug("popup.__childAdded")

            // is an item ? store and pass to menu
            if (child._hasFeature("WEBF_ITEM") && !this._hasFeature("WEBF_ITEM_CONTAINER")){
                webf_push(this._items,child);
                if (!this._data.menu){
                } else {
                    this._data.menu._childAdded(child);
                }
            // is implemented ?
            } else if (this._webfImpl){
                if (child._hasFeature("WEBF_ITEM_CONTAINER")){
                    this._data.menu=child;
                    this._webfImpl.appendChild(child);
                    for (var i = 0; i < this._items.length; i++) {
                        child._childAdded(this._items[i]);
                    }
                    // is it implemented ?
                } else if (child._hasFeature("WEBF_SHADOW"))
                    this._webfImpl.appendChild(child._webfImpl);
                else
                    this._webfImpl.appendChild(child);

                webf_push(this._components,child);

            } else {
                if (child._hasFeature("WEBF_ITEM"))
                    webf_push(this._items,child);
                else
                    webf_push(this._components,child);
            }
            child.__parent=this;
            webf_push(this._components,child);

/*
            // is it an item ?
            if (child._hasFeature("WEBF_ITEM") && !this._hasFeature("WEBF_ITEM_CONTAINER")){
                webf_push(this._items,child);
                if (!this._data.menu){
                    //if (!this._items) this._items=[];
                    //this._items.push(child);
                } else {
                    this._data.menu._childAdded(child);
                }
            // if I add a menu, add also items
            } else if (child._hasFeature("WEBF_ITEM_CONTAINER")){
                this._data.menu=child;
                this._webfImpl.appendChild(child);
                for (var i = 0; i < this._items.length; i++) {
                    child._childAdded(this._items[i]);
                }
            // is it implemented ?
            } else if (this._webfImpl){
                child.__parent=this;
                // some time I shoud insert child._webfImpl
                if (child._hasFeature("WEBF_SHADOW"))
                    this._webfImpl.appendChild(child._webfImpl);
                else
                    this._webfImpl.appendChild(child);

                webf_push(this._components,child);
            } else {
                // still not implemented store child
                webf_push(this._components,child);
            }
            // standard stuff
            child.__parent=this;
            webf_push(this._components,child);*/
        },
        __childRemoved: function(child){
            //
        },
    },

    apply_after: function(){
        for (var i = 0; i < this._components.length; i++) {
            this._childAdded(this._components[i]);
        }
        if (this._hasFeature("WEBF_ITEM_CONTAINER")){
            for (var i = 0; i < this._items.length; i++) {
                this._childAdded(this._items[i]);
            }
        }
    }
},WEBF_I18N,WEBF_FEATURE("WEBF_CONTAINER"));

/****
 * the component is a set of item Ex. list, menu, accordion etc...
 *
 *
 *
 * @type {*}
 */

var WEBF_ITEM_CONTAINER=webf_features({
    name: "WEBF_ITEM_CONTAINER",
},WEBF_FEATURE("WEBF_ITEM_CONTAINER"),WEBF_CONTAINER);


/*** Manages components.
 *
 * - if a component is inside a WEBF_CONTAINER it is stored to be added later
 * - it is also used by tooltip to find where it is showed
 *
 * must be changed into WEBF_COMPONENT and putted inside Web Component definition
 *
 *
 *
 * @ todo: manage disabled
 * @ todo: pass styles to webfimpl
 *
 * @type {*}
 */
var WEBF_CORE=webf_features({
    name: "WEBF_CORE",

    methods: {

        __valutToString: function(value){
            if (value.getAttribute("label")) return value.getAttribute("label");
            if (value.getAttribute("text")) return value.getAttribute("text");
            if (value.getAttribute("value")) return value.getAttribute("value");

            return value;
        },
        __valueAsString: function(v,sep){
            if (!sep) sep=", ";
            var arr=[];
            if (Object.prototype.toString.call( v ) === '[object Array]'){
                for (var i = 0; i < v.length; i++) {
                    var obj = v[i];
                    if (obj.isWEBF){
                        if (obj._hasFeature("WEBF_VALUE")){
                            arr.push(this._valutToString(obj));
                        }
                    }
                }
            } else {
                if (v.isWEBF){
                    if (v._hasFeature("WEBF_ITEM")){
                        arr.push(this._valutToString(v));
                        //arr.push(v.label?v.label: v.value? v.value : v);
//                        arr.push(v.value);
                    } else if (v._hasFeature("WEBF_VALUE")){
                        arr.push(this._valutToString(v.value));
//                        arr.push(v.value);
                    } else
                    arr.push(v);
                } else
                    arr.push(v);

            }
            return arr.join(sep);
        },

    },

    apply_after_insert: function(){
        //webf_log("apply_after_insert")
        var webfC=this._hasParentFeature("WEBF_CONTAINER");
        if (webfC){
            webfC._childAdded(this);
        }
    },
    apply_after_remove: function(){
        var webfC=this._hasParentFeature("WEBF_CONTAINER");
        if (webfC){
            webfC._childRemoved(this);
        }
    },

    apply_before: function(){
        //webf_debug("apply_before ",this);
        var webfC=this._hasParentFeature("WEBF_CONTAINER");
        if (webfC){
            this.__parent=webfC;
        }
    },
    apply_build: function(){},
    apply_after: function(){
        var self=this;
        var htmlcontent=$(self._data.htmlcontent);
        $('[content]',this._webfImpl).each(function(){
            var contentSelector=$(this).attr("content");
            if (contentSelector!=''){
                $(this).html($(contentSelector,htmlcontent));
            } else {
                $(this).html(htmlcontent);
            }
        });

        /**
         * if it is in a menu do not manage containing the menu will do it
         *
         * but sub popup should be managed
         *
         * TODO: this is implementation issue and should be put outside the features
         *
         * **/
        /*var webfC=this._hasAscendantFeature("WEBF_CONTAINER");
        var self=this;

        //var webfParent=this._hasAscendantFeature("WEBF_CORE");

        if (webfC
            //&&
            //!webfParent._hasFeature("WEBF_MENU")
            //!this._hasAscendantFeature("WEBF_MENU")
            ){
            var self=this;
            if (!webfC._components) webfC._components=[];
            self.__parent=webfC;
            //webfC._components.push(self)
            //webfC.appendChild(self);
        }*/

    }
},WEBF_FEATURE("WEBF_CORE"),WEBF_CONTAINER);

/***
 * The component is traversable
 *
 * todo: manage focus, check tabindex, also with form
 *
 * @type {*}
 */
var WEBF_TRAVERSABLE=webf_features({
    name: "WEBF_TRAVERSABLE",
    apply_before: function(){},
    apply_build: function(){},
    apply_after_insert: function(){
        if (this.children.length)
            this.children[0].setAttribute("tabindex",webf_indexOf(this.parentNode.children,this));
    }
},WEBF_FEATURE("WEBF_TRAVERSABLE"));

/***
 * The component is clickable
 *
 *
 * @type {*}
 */
var WEBF_CLICKABLE=webf_features({
    name: "WEBF_CLICKABLE",

    apply_before: function(){},
    apply_build: function(){},
    apply_after: function(){
    }
},WEBF_FEATURE("WEBF_CLICKABLE"));

/***
 * The component is a menu item,
 *
 * - manage mouseenter and leave
 *
 * @type {*}
 */
var WEBF_ARMED=webf_features({
    name: "WEBF_ARMED",
    accessors: {
        armed : {
            get: function(){ return this._data.armed; },
            set: function(v){
                this._data.armed=v;
                this._armed(v);
            },
        }
    },
    methods : {
        _armed: function(v){}
    },

    apply_after: function(){
        var self=this;

        var node=this._webfImpl$.hasClass("menu_item") ? this._webfImpl$ : $(".menu_item", this._webfImpl);

        node
            .mouseenter(function(){
                // hide all descendant popup
                var popup=self._getAscendantFeature("WEBF_POPUP")[0];

                if (popup){
                    if (self.armed){
                        self.armed=1;
                        if (popup.length>0){
                            popup[0]._show_popup(self);
                        }
                        return;
                    }

                    popup._getDescendantFeature("WEBF_POPUP").each(function(ix,e){
                        e._hide_popup(self);
                    });
                    popup._getDescendantFeature("WEBF_MENUITEM").each(function(ix,e){
                        e.armed=0;
                        //e._armed(0);
                    });
                }
                //self._armed(1);
                self.armed=1;

                // todo: not descendat but children
                // todo: if is into an action dont show
                var popup=self._getDescendantFeature("WEBF_POPUP");
                //var popup=self._getChildrenFeature("WEBF_POPUP");
                if (popup.length>0){
                    popup[0]._show_popup(self);
                    //popup[0]._show_popup(self);
                }
            })
            .mouseleave(function(){
                //self._armed(0);
                // todo: not descendat but children
                // todo: if is into an action dont show
                //var popup=self._getChildrenFeature("WEBF_POPUP");
                //var popup=self._getDescendantFeature("WEBF_POPUP");
                //if (popup.length>0){
                //popup[0]._hide_popup(self);
                //popup[0]._hide_popup(self);
                //}
            });
    }
},WEBF_FEATURE("WEBF_ARMED"));

/***
 * The component is selectable
 *
 * the _selected method should be implemented
 *
 * @type {*}
 */
var WEBF_SELECTABLE=webf_features({
    name: "WEBF_SELECTABLE",
    accessors : {
        selected: {
            get: function(){ return this._data.selected; },
            set: function(v){
                if (v==this) this._data.selected=true;
                else if (v==="true") {
                    this._data.selected=true;
                    var group=this._getAscendantFeature("WEBF_GROUP");
                    if (group){
                        group.selected=this;
                        return;
                    }
                } else this._data.selected=false;
                if(this._selected)
                    this._selected(this._data.selected);
            }
        }
    },
    methods: {
        _selected: function(){  } // implements status change
    },
    apply_after: function(){
        this.addClass(this._webfImpl,"selectable");
    }

},WEBF_FEATURE("WEBF_SELECTABLE"));

/***
 * The component has a value, value is propagable
 *
 * the _value method should be implemented
 *
 * todo should manage values taken from a list
 *
 * @type {*}
 */
var WEBF_VALUE=webf_features({
    name: "WEBF_VALUE",
    accessors : {
        value: {
            get: function(){
                //if (this.__value.isWEBF && this.__value._hasFeature("WEBF_VALUE")) return this.__value.value;
                return this._data.value;
            },
            set: function(v){
                this._data.value=v;
                //webf_debug("set value");
                if(this._value)
                    this._value(this._data.value);
            }
        }
    },
    methods: {
        _value: function(v){
            // if parent is value then this value is parent value
            var valueF=this.__parent &&
                       this._hasParentFeature("WEBF_VALUE") &&
                       !this._hasFeature("WEBF_SELECTION");
            if (valueF) valueF.value=v;
        } // implements status change
    },
    apply_after: function(){
        if (this.getAttribute("value"))
            this.value=this.getAttribute("value");
    }

},WEBF_FEATURE("WEBF_VALUE"));


/***
 * The component belong to a group
 *
 * todo: should also manage groups outside container's Ex. via attribute group
 *
 * when you set the selected, it assign ...
 *
 *
 * @type {*}
 */
var WEBF_GROUP=webf_features({
    name: "WEBF_GROUP",
    accessors: {
        value: {
            get: function(){
                return this._data.value ?
                    this._data.value._hasFeature("WEBF_VALUE") ?
                        this._data.value.value :
                        this._data.value
                    : null;
            }
        },
        selected: {
            get: function(){
                return this._data.selected;
            },
            set: function(v){
                var values = this._getAllDescendantFeature("WEBF_SELECTABLE");
                for (var i = 0; i < values.length; i++) {
                    var obj = values[i];
                    //webf_log("selected", obj, v, obj==v)
                    obj.selected=obj==v ? v : null;
                    if (obj==v){
                        this._data.selected=v;
                        v._selected(v);
                    }
                }
            }
        }
    },
    methods: {
        _selected: function(v){}
    },

    apply_before: function(){},
    apply_build: function(){},
    apply_after: function(){

    }
},WEBF_FEATURE("WEBF_GROUP"),WEBF_CORE);

/***
 * Manages button groups
 *
 *
 * @type {*}
 */
var WEBF_BUTTON_GROUP=webf_features({
    name: "WEBF_BUTTON_GROUP",
    apply_before: function(){},
    apply_build: function(){},
    apply_after: function(){
    }
},WEBF_FEATURE("WEBF_BUTTON_GROUP"));


/***
 * The component has an action
 *
 * define a property __action put here the action management code
 *
 * todo integrate with forms
 *
 * -if it is inside a popup close it
 *
 * @type {*}
 */
var WEBF_ACTION=webf_features({
    name: "WEBF_ACTION",
    accessors : {
        action: {
            get: function(){
                return this.__action;
            },
            set: function(v){ this.__action=v; }
        }
    },
    methods: {
        _action: function(e){
            // should close ?
            if (this.__action){
                this.__action.apply(this,[e]);
                //e.stopPropagation();
            } else {
                if (this._hasFeature("WEBF_ITEM")){
                    var value = this._hasAscendantFeature("WEBF_SELECTION");
                    if (value){
                        value._selection_add(this);
                    }
                }
                if (this.__parent && this._hasParentFeature("WEBF_ACTION")){
                    this.__parent._action(e);
                }
            }
            e.stopPropagation();
        }
    },
    apply_after: function(){
        this.addClass(this.children[0],"action");
        //webf_log("Register action on "+this.name,this )
        $(this).click(function(e){
            var popupF=this._hasAscendantFeature("WEBF_POPUP");
            // todo: not ascendant but parent
            // todo: not DescendantFeature("WEBF_POPUP") but children
            if (popupF){
                // dont close because we are going to open a menu
                if (!this._hasChildrenFeature("WEBF_MENU"))
                    this._getAscendantFeature("WEBF_MENU").forEach(function(e){
                        e._hide_popup();
                    });

            }
            if(this._action) this._action(e);
            e.stopPropagation();
        })
    }
},WEBF_FEATURE("WEBF_ACTION"));

/***
 * The component has a status
 *
 * todo multistatus
 *
 * the _status method should be implemented
 *
 * @type {*}
 */
var WEBF_STATUS=webf_features({
    name: "WEBF_STATUS",
    accessors : {
        status: {
            get: function(){ return this._data.status; },
            set: function(v){
                this._data.status=v;

                // change appearence
                if(this._status)
                    this._status(this.status);

                // set the value
                this.value=v;
            }
        }
    },
    methods: {
        toggle: function(){ this.status=!this.status; },
        _action: function(){
            //if (this.action) this.action(this);
            //else
            var group = this._hasAscendantFeature("WEBF_GROUP");
            if (group && this._hasFeature("WEBF_SELECTABLE")){
                group.selected=this;
                this.status="true";
            } else
                this.status=!this.status;
            //this.status=this.status!="true";
        },
        _status: function(){  } // implements status change

    },
    apply_after: function(){
        this.status = this.getAttribute("status")=="true";
        this.addClass(this.children[0],"status");
    }

},WEBF_FEATURE("WEBF_STATUS"), WEBF_VALUE);

/***
 * The component has a status
 *
 * todo: to finish implementation (ctrl, shift)
 *
 * the _status method should be implemented
 *
 * @type {*}
 */
var WEBF_SELECTION=webf_features({
    name: "WEBF_SELECTION",
    accessors : {
        selected_items: {
            get: function(){ return this._selections; },
            set: function(v){
                this._selections=v;
                this._selection_update(this._selections);
            }
        },
        selected_item: {
            get: function(){ return this._selections[0]; },
            set: function(v){
                this._selections=[v];
                this._selection_update(this._selections);
            }
        },

        selection_type: {
            get: function(){ return this._selection_type; },
            set: function(v){
                switch (v){
                    case 'single':
                        this._selection_type=0;
                        break;
                    case 'multiple':
                        this._selection_type=1;
                        break;
                }
            }
        },
    },
    methods: {
        _selection_update: function(items){

            if (this._hasFeature("WEBF_VALUE")){
                if (this.selection_type==0)
                    this.value=this.selected_item;
                else
                    this.value=items;
            }

        },

        _selection_clear: function(item){
            this._selections=[];
            this._selection_update(this._selections);
        },
        _selection_add_range: function(start,end){
            if (!this._hasFeature("WEBF_LIST")) return;
            var items=this.items;
            for (var i = start; i < item.length && i<end; i++) {
                this._selection_add_item(item[i])
            }

            this._selection_update(this._selections);
        },
        _selection_remove_range: function(start,end){
            if (!this._hasFeature("WEBF_LIST")) return;
            var items=this.items;
            for (var i = start; i < item.length && i<end; i++) {
                this._selection_remove_item(item[i])
            }

            this._selection_update(this._selections);
        },
        _selection_add: function(item){
          if (Object.prototype.toString.call( item ) === '[object Array]'){
              for (var i = 0; i < item.length; i++) {
                this._selection_add_item(item[i]);
              }
          } else {
              this._selection_add_item(item);
          }

          this._selection_update(this._selections);
        },
        _selection_remove: function(item){
            if (Object.prototype.toString.call( item ) === '[object Array]'){
                for (var i = 0; i < item.length; i++) {
                    this._selection_remove_item(item[i]);
                }
            } else {
                this._selection_remove_item(item);
            }

            this._selection_update(this._selections);
        },
        /**
         * No update from this
         * */
        _selection_add_item: function(item){
            if (!item._hasFeature || this._hasFeature("WEBF_ITEM")) return;
            if (webf_indexOf(this._selections, item)!=-1) return;
            if (this._selection_type==0){
                this._selections=[];
            }
            //this._selections.push(item);
            webf_push(this._selections,item);
        },
        _selection_remove_item: function(item){
            if (!item._hasFeature || this._hasFeature("WEBF_ITEM")) return;
            var ix=webf_indexOf(this._selections, item);
            if (ix==-1) return;
            this._selections.splice(ix,1);
        },
    },
    apply_after: function(){
        this._selections=[];
        this.selection_type=this.getAttribute("selection") == "multiple" ? "multiple" : "single";
        // manage click in the list with shift and control etc.
    }

},WEBF_FEATURE("WEBF_SELECTION"));


/***
 * The component has a status
 *
 * the _status method should be implemented
 *
 * todo manahe add, remove etc.
 *
 * @type {*}
 */
var WEBF_LIST=webf_features({
    name: "WEBF_LIST",
    accessors : {
        direction: {
            get: function(){
                return this.getAttribute("direction");
            },
            set: function(v){
                this.setAttribute("direction",v);
            }
        },
        items: {
            get: function(){
                var items = this._getDescendantFeature("WEBF_ITEM");
                return items;
            },
            set: function(v){
                this._clear_list();
                for (var i = 0; i < v.length; i++) {
                    var obj = v[i];
                    this._add_item(obj);
                }
            }
        }
    },
    methods: {
        _clear_list: function(){},
        _add_item: function(item){

        },
    },
    apply_after: function(){
        $(this._webfImpl).css("z-index","");
        this.direction=this.getAttribute("direction");
    }

},WEBF_FEATURE("WEBF_LIST"),WEBF_ITEM_CONTAINER,WEBF_VALUE,WEBF_SELECTION);

/***
 * The component has an action
 *
 * define a property __action put here the action management code
 *
 * todo manage keys and actions and value
 *
 * -if it is inside a popup close it
 *
 * @type {*}
 */
var WEBF_INPUT=webf_features({
    name: "WEBF_INPUT",
    accessors : {
        action: {
            get: function(){ return this.__action; },
            set: function(v){ this.__action=v; }
        }
    },
    methods: {
        _action: function(e){
            // should close ?
            if (this.__action){
                this.__action(this,e);
                e.stopPropagation();
            }
            e.stopPropagation();

        }
    },
    apply_after: function(){
        this.addClass(this.children[0],"action");
    }
},WEBF_FEATURE("WEBF_INPUT"),WEBF_CORE);

/***
 * The component is a button
 *
 *
 * @type {*}
 */
var WEBF_BUTTON=webf_features({
    name: "WEBF_BUTTON",
    apply_after: function(){
        this.addClass(this.children[0],"button");
    }
    },WEBF_ACTION,WEBF_CORE,WEBF_FEATURE("WEBF_BUTTON"));

const WEB_MODAL_ZINDEX=5;
const WEBF_WINDOW_ZINDEX=20;
const WEB_POPUP_ZINDEX=10;
const WEB_MENU_ZINDEX=30;


/***
 * The window is Modal show the background
 *
 *
 * @type {*}
 */
var WEBF_MODAL=webf_features({
    name: "WEBF_MODAL",
    accessors : {
        isModal: {
            get: function(){ return this.getAttribute("modal")==='true'; },
            set: function(v){ this.setAttribute("modal", v ? "true" : 'false'); }
        }
    },
    methods: {
        _show_popup: function(e){
            if (this.isModal){
                var modalPanel = $("g-modal");
                if (modalPanel.length==0){
                    document.body.appendChild(document.createElement("g-modal"));
                }
                // setup size
            $("g-modal")[0]._webfImpl$.css("z-index",WEB_MODAL_ZINDEX).css("display","block").css("visibility","visible");
            }
        },
        _hide_popup: function(e){
            if (this.isModal){
                var modalPanel = $("g-modal");
                if (modalPanel.length>0){
                    $("g-modal")[0]._webfImpl$.css("display","none").css("visibility","hidden");
                }
            }
        },
    },

    apply_before: function(){

    },
    apply_build: function(){},
    apply_after: function(){

    }
},WEBF_FEATURE("WEBF_MODAL"));

/***
 * Calculate Popup menu constraints
 *
 * popup.width + res.left > window.width -> anchor="right=left"
 * popup.height + res.top > window.height -> anchor="bottom=top"
 * popup.height > window.height -> anchor="t=window height=height"
 * popup.width > window.width -> anchor="t=window width=width"
 *
 * @type {*}
 */
var WEBF_MENU_CONSTRAINTS=webf_features({
    methods: {
        _apply_position: function(popup,res){
        },
    },

},WEBF_FEATURE("WEBF_MENU_CONSTRAINTS"));


/***
 * The component is a popup window not a menu, the window is showed inside the component where it is defined
 *
 *
 * @type {*}
 */
var WEBF_POPUP=webf_features({
    name: "WEBF_POPUP",
    methods: {
        _hide: function(e){
            var popup=this._webfImpl$;
            popup.css("display","none").css("opacity","0").css("visibility","hidden");
        },
        _show: function(e){
            var popup=this._webfImpl$;
            var ascPopup = this._hasAscendantFeature("WEBF_POPUP");
            if (ascPopup && ascPopup._webfImpl$.css("z-index"))
                popup.css("z-index",parseInt(ascPopup._webfImpl$.css("z-index")+1));
            else if (!popup.css("z-index"))
                popup.css("z-index",WEB_POPUP_ZINDEX);

            popup
                .css("display","block")
                .css("opacity","1").css("visibility","visible");
            this._position_popup(e);
        },

        _hide_popup: function(e){
            // should close ?
            //var popup=$(this).children(".webf_bbed4b97553b66c304c981e543af5ef3");
            var popup=this._webfImpl$;
            this._getDescendantFeature("WEBF_POPUP").each(function(ix,e){
                e._hide_popup(self);
            });
            this._hide(e);
        },
        __adjust_position_popup: function(e, position){},
        _position_popup:function(e){
            function getTarget(e){
                if (e && e.isWEBF) return e._webfImpl;
                return e;
            }
            var self=this;
            var item=this._hasAscendantFeature("WEBF_MENUITEM");
            var popup=this._webfImpl$;

            var anchor=this.getAttribute('anchor');
            // decide where popup is to be set
            // t=(parent|document)
            // top=top|bottom|middle|amiddle
            // bottom=top|bottom|middle|amiddle
            // left=left|right|center|acenter
            // right=left|right|center|acenter
            // ex
            //      t=document top=center left=center <- this is centered
            //      t=document top=middle left=middle <- starts from the middle of the screen
            if (!anchor){
                //if (item)
                //    anchor="top=top t=container left=right";
                //else
                //    anchor="t=container top=bottom left=left width=width";
                anchor="top=bottom left=left";
            } else {
                //webf_log("a");
            }

            if (anchor){
                var arr=anchor.split(" ");
                var farr=[];

                var f={
                    "t": {
                        parent: function(){ return getTarget(e); },
                        document: function(){ return e.ownerDocument; },
                        window: function(){ return window; },
                        container: function(){
                            var arr=self._getAscendantFeature("WEBF_POPUP");
                            if (arr.length==0) return getTarget(self._hasAscendantFeature("WEBF_CONTAINER"));
                            return getTarget(arr[arr.length-1]);
                        },
                    },
                    "set_width": function(trg, self,value, res){
                        res["width"]=value;
                        res["max-width"]=value;
                        res["overflow"]="auto";
                        //$(self).css("width",value).css("max-width",value).css("overflow-x","hidden");
                    },
                    "width": function(trg, self,adjustment){
                        return $(trg).outerWidth()+(adjustment&&adjustment.width?adjustment.width:0);
                    },
                    "set_height": function(trg, self,value, res){
                        res["height"]=value;
                        res["max-height"]=value;
                        res["overflow-x"]="auto";
                        //$(self).css("height",value).css("max-height",value).css("overflow-x","auto");
                    },
                    "height": function(trg, self,adjustment){
                        return $(trg).outerHeight()+(adjustment&&adjustment.height?adjustment.height:0);
                    },

                    "set_top": function(trg, self,value, res){
                        res["top"]=value;
                        //$(self).css("top",value);
                    },
                    "top": function(trg, self,adjustment){
                        return $(trg).offset().top+(adjustment?adjustment.top:0);
                    },
                    "set_bottom": function(trg, self,value, res){
                        res["bottom"]=value;
                        //$(self).css("bottom",value);
                    },
                    "bottom": function(trg, self,adjustment){
                        return $(trg).offset().top+$(trg).outerHeight()+(adjustment&&adjustment.top?adjustment.top:0);
                    },
                    "set_left": function(trg, self,value, res){
                        res["left"]=value;
                        //$(self).css("left",value);
                     },
                    "left": function(trg, self,adjustment){
                        return $(trg).offset().left+(adjustment?adjustment.left:0);
                    },
                    "set_right": function(trg, self,value, res){
                        res["right"]=value;
                        //$(self).css("right",value);
                    },
                    "right": function(trg, self,adjustment){
                        return $(trg).offset().left+$(trg).outerWidth()+(adjustment&&adjustment.left?adjustment.left:0);
                    },

                    "middle": function(trg, self,adjustment){
                        var offset=$(trg).offset();
                        var height=$(trg).outerHeight();
                        var scrollTop = $(window).scrollTop();
                        return scrollTop+
                        ((offset ? offset.top:0)+
                            height-
                            $(self).height()
                        )/2+
                            (adjustment&&adjustment.top?adjustment.top:0);
                    },
                    "a_middle": function(trg, self,adjustment){
                        var offset=$(trg).offset();
                        var height=$(trg).outerHeight();
                        var scrollTop = $(window).scrollTop();

                        return scrollTop+
                            ((offset ? offset.top:0)+height)/2+
                            (adjustment&&adjustment.left?adjustment.top:0)+(adjustment?adjustment.top:0);
                    },

                    "center": function(trg, self,adjustment){
                        var offset=$(trg).offset();
                        var width=$(trg).outerWidth();

                        return (
                            (offset ? offset.left:0)+
                                width-
                                $(self).width()
                            )/2+(adjustment&&adjustment.left?adjustment.left:0);
                    },
                    "a_center": function(trg, self,adjustment){
                        var offset=$(trg).offset();
                        var width=$(trg).outerWidth();

                        return ((offset ? offset.left:0)+width)/2+(adjustment&&adjustment.left?adjustment.left:0);
                    },
                }

                var target=getTarget(item ? item : e);
                arr.forEach(function(e){
                    var a1=e.split("=");
                    if (a1[0]=='t')
                        target= f.t[a1[1]]();
                    else farr.push((function(trg, setF, getF){
                        return function(self, adjustment,res){
                            setF(trg,self,getF(trg, self, adjustment),res);
                        };
                    })(target,f["set_"+a1[0]], f[a1[1]]));
                });
                var anchorF=(function(arr){
                    return function(self, adjustment,res){
                        arr.forEach(function(e){
                            e(self, adjustment,res);
                        });
                    }
                })(farr);
            }

            var res={};
            if (item){
                e=item;
                //var position=this._hasAscendantFeature("WEBF_POPUP") ? {top:0, left:0} : $(e).offset();
                //var position=this._hasAscendantFeature("WEBF_POPUP")?{top:-$(e).offset().top, left:-$(e).offset().left} : {top:0, left:0};
                var position={top:0, left:0};
                this._adjust_position_popup(target,position);
                anchorF(popup,position,res);

                //popup.css("top",position.top).css("left",position.left+$(e).width());
            } else {
                //var position=this._hasAscendantFeature("WEBF_POPUP") ? {top:0, left:0} : $(e).offset();
                var position={top:0, left:0};
                this._adjust_position_popup(target,position);
                anchorF(popup,position,res);
                //popup.css("top",position.top+$(e).height()).css("left",position.left);
            }
            this._apply_position(popup,res);

        },
        _apply_position: function(popup,res){
            for (var key in res) {
              popup.css(key,res[key]);
            }
        },
        _show_popup: function(e){
            // should close ?
            //var popup=$(this).children(".webf_bbed4b97553b66c304c981e543af5ef3");
            var popup=this._webfImpl$;

            this._getDescendantFeature("WEBF_POPUP").each(function(ix,e){
                e._hide(self);
            });
            this._getDescendantFeature("WEBF_MENUITEM").each(function(ix,e){
                e._armed(0);
            });
            this._show(e);
        },

        _toggle_popup: function(e){
            // should close ?
            //var popup=$(this).children(".webf_bbed4b97553b66c304c981e543af5ef3");
            var popup=this._webfImpl$;

            if (popup.css("display")=='none'){
                this._show_popup(e);
            } else
                this._hide_popup(e);
            //if (this.action) this.action(this);
        },

        _setup_popup: function(){
            var self=this;
            //this._webfImpl$.css("z-index",8);
            document.body.appendChild(this._webfImpl);

            if (this._hasAscendantFeature("WEBF_HORIZONTAL_LIST")){
                this.setAttribute("anchor","top=bottom left=left");
            } else  if (this._hasAscendantFeature("WEBF_POPUP")){
                this.setAttribute("anchor","top=top left=right");
            }

            // am I inside an input ?
            var inputF = this.__parent && this._hasParentFeature("WEBF_INPUT") ? this.__parent:null;
            if (inputF){
                this.setAttribute("anchor","top=bottom left=left width=width");
                $(inputF).click(function(e){
                    self._toggle_popup(inputF);
                    e.stopPropagation();
                })
            }
        }
    },

    apply_after: function(){
        this._setup_popup();
    }
},WEBF_FEATURE("WEBF_POPUP"),WEBF_MODAL,WEBF_CORE);


/***
 * The component is a menu, if it is inside an action, manage the click to show it
 *
 *
 * @type {*}
 */
var WEBF_MENU=webf_features({
    name: "WEBF_MENU",

    methods: {
        _value: function(items){
            // add value to parent
            var value=this._hasAscendantFeature("WEBF_VALUE");
            if (value) value.value=items;

            for (var i = 0; i < this.items.length; i++) {
                this.items[i]._selected(null);
            }

            if (Object.prototype.toString.call( items ) === '[object Array]'){
                for (var i = 0; i < items.length; i++) {
                    var obj=items[i];
                    if (obj.isWEBF && obj._hasFeature("WEBF_SELECTABLE")){
                        obj._selected(obj);
                    }
                }
            } else if (items.isWEBF && items._hasFeature("WEBF_SELECTABLE")){
                items._selected(items);
            }
        }
    },

    apply_after: function(){
        this._webfImpl$.css("z-index",WEB_MENU_ZINDEX);
        // am i in inside an Action ?
        var actionF=this._hasAscendantFeature("WEBF_ACTION");
        var self=this;
        if (actionF){
            var self=this;
            actionF.__action=function(e){
                //actionF.appendChild(self);
                self._toggle_popup(actionF);
                e.stopPropagation();
            }
        }
        //return -1;
    }
},WEBF_FEATURE("WEBF_MENU"),WEBF_MODAL,WEBF_POPUP,WEBF_LIST);

/***
 * The component is an item,
 *
 * - manage mouseenter and leave
 *
 * todo manage attribute selected
 *
 * @type {*}
 */
var WEBF_ITEM=webf_features({
    name: "WEBF_ITEM",
    accessors: {
        label: {
            get: function(){ return this.getAttribute("label"); },
            set: function(v){ this.setAttribute("label",v); }
        },
        value: {
            get: function(){ return this.getAttribute("value"); },
            set: function(v){ this.setAttribute("value",v); }
        }
    },

    apply_after: function(){
    }
},WEBF_FEATURE("WEBF_ITEM"),WEBF_ARMED,WEBF_CORE,WEBF_VALUE,WEBF_SELECTABLE);


/***
 * The component is a menu item,
 *
 *
 * @type {*}
 */
var WEBF_MENUITEM=webf_features({
    name: "WEBF_MENUITEM",
    accessors: {
    },

    apply_after: function(){
        var self=this;
        if (this.children.length)
            //this.children[0].setAttribute("selectable","1");
            this.addClass(this.children[0],"menu_item");

        // to Manage popup outside popup
        //var popupF=this._hasAscendantFeature("WEBF_POPUP");
        //if (!popupF){
        //    this.addClass(this.parentNode,"webf_bbed4b97553b66c304c981e543af5ef3");
        //}
        //xtag.addEvent(this.querySelector(".menu_item"),"mouseenter",function(){ self._selected(1) });
        //xtag.addEvent(this.querySelector(".menu_item"),"mouseleave",function(){ self._selected(0) });
    }
},WEBF_FEATURE("WEBF_MENUITEM"),WEBF_ARMED,WEBF_CORE,WEBF_ITEM);

/***
 * Manage sizing
 *
 *
 * @type {*}
 */
var WEBF_SIZE=webf_features({
    name: "WEBF_GROUP",

    apply_before: function(){},
    apply_build: function(){},
    apply_after: function(){
    }
},WEBF_FEATURE("WEBF_SIZE"));

/***
 * Manage forms
 *
 * todo implements
 *
 * @type {*}
 */
var WEBF_FORM=webf_features({
    name: "WEBF_FORM",

    apply_before: function(){},
    apply_build: function(){},
    apply_after: function(){
    }
},WEBF_FEATURE("WEBF_FORM"),WEBF_CORE);

/***
 * The component is a Tooltip
 *
 * todo: anchor when in a input
 *
 * @type {*}
 */
var WEBF_TOOLTIP=webf_features({
    name: "WEBF_TOOLTIP",
    methods: {
    },

    apply_after: function(){
        var webfF=this._hasAscendantFeature("WEBF_CORE");
        var self=this;
        if (webfF){
            var self=this;

            $(webfF).mouseenter(function(){
                self._show_popup(webfF);
            }).mouseleave(function(){
                self._hide_popup(webfF);
            });
        }
    }
},WEBF_FEATURE("WEBF_TOOLTIP"),WEBF_CORE,WEBF_POPUP);

/***
 * This is a window
 *
 *
 * @type {*}
 */

var WEBF_WINDOW=webf_features({
    name: "WEBF_WINDOW",

    apply_before: function(){},
    apply_build: function(){},
    apply_after: function(){
        var self=this;
        this._webfImpl$.css("z-index",WEBF_WINDOW_ZINDEX);
        var actionF=this._hasAscendantFeature("WEBF_ACTION");
        var self=this;
        if (actionF){
            var self=this;
            actionF.__action=function(e){
                self._show_popup(actionF);
                e.stopPropagation();
            }
        }
        $(".WEBF_CLOSE_ACTION").click(function(e){
            self._hide_popup(this);
            e.stopPropagation();
        });
    }

},WEBF_FEATURE("WEBF_WINDOW"),WEBF_POPUP);

/***
 * This is a window
 *
 *
 * @type {*}
 */
var WEBF_DIALOG=webf_features({
    name: "WEBF_DIALOG",

    apply_before: function(){},
    apply_build: function(){},
    apply_after: function(){
        if (!this.getAttribute("anchor")) this.setAttribute("anchor","t=window top=middle left=center");
    }
},WEBF_FEATURE("WEBF_DIALOG"),WEBF_WINDOW);

/***
 * This is a window
 *
 * todo action? is a list? selection?
 *
 * @type {*}
 */
var WEBF_ACCORDION=webf_features({
    name: "WEBF_ACCORDION",
},WEBF_FEATURE("WEBF_ACCORDION"),WEBF_LIST);
var WEBF_ACCORDION_ITEM=webf_features({
    name: "WEBF_ACCORDION_ITEM",
},WEBF_FEATURE("WEBF_ACCORDION_ITEM"),WEBF_CORE,WEBF_ITEM);

/****
 * Use the _webfImpl instead of webf
 *
 *
 * @type {*}
 */
var WEBF_SHADOW=webf_features({
    name: "WEBF_SHADOW",
},WEBF_FEATURE("WEBF_SHADOW"));

/****
 * Use the _webfImpl instead of webf
 *
 *
 * @type {*}
 */
var WEBF_HORIZONTAL_LIST=webf_features({
    name: "WEBF_HORIZONTAL_LIST",
},WEBF_FEATURE("WEBF_HORIZONTAL_LIST"));

/**
 * todo: components
 *     TAB TABLE TREE LAYOUTS or PANEL,
 *     DATE, COLOR, country PICKER,
 *     SEPARATOR
 *     SLIDER ... ,
 *     NAV_MENU, SIDE_MENU, TOC,
 *     INPUT+TAG,
 *     ICON, A (with external)
 *     ARTICLE
 *
 *
 *
 * **/


window.addEventListener('WebComponentsReady', function() {
    try {
        // manage windows
        document.createElement("webf_window_manager");
        // i18n manager

        var link = document.querySelectorAll('link[rel=import]');
        for (var i = 0; i < link.length; i++) {
            var e = link[i];
            if (!e.content) continue;
            var content = e.content.querySelectorAll('template');
            for (var j = 0; j < content.length; j++) {
                var e1 = content[j];
                var id= e1.id;
                if (!e1.content) continue;
                var styles = e1.content.querySelectorAll('style');
                //var styles = e1._content.querySelectorAll('style');
                for (var k = 0; k < styles.length; k++) {
                    var e2 = styles[k];
                    e2.id=id;
                    document.body.appendChild(e2.cloneNode(true));
                }
            }
        }
        /*link.forEach(function(e){
            var content = e.content.querySelectorAll('template');
            content.forEach(function(e){
                var id= e.id;
                e._content.querySelectorAll('style').forEach(function(e){
                    e.id=id;
                    document.body.appendChild(e.cloneNode(true));
                });
            });
        });*/

    } catch (e){
        alert();
    }
    return false;
});

window.addEventListener('HTMLImportsLoaded', function() {
    try {
        /* i18n manager
        var i18nMNGR=document.createElement("webf_i18n_manager");

        var link = document.querySelectorAll('link[rel=import]');
        for (var i = 0; i < link.length; i++) {
          var e = link[i];
            var content = e.content.querySelectorAll("i18n");
            for (var j = 0; j < content.length; j++) {
                var e1 = content[j];
                var id= e1.id;
                var d=JSON.parse(e1.textContent);
                i18nMNGR._addKeys(e1.getAttribute("lang"), d);

            }
        }*/

    } catch (e){
        alert();
    }
    return false;
});