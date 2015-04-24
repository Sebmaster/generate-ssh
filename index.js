"use strict";

var path = require("path");
var fs = require("fs");
var spawn = require("child_process").spawn;

var which = require("which");
var temp = require("temp");

var additionalPaths = {
  win32: [
    "C:\\Program Files (x86)\\Git\\bin",
    "C:\\Program Files\\Git\\bin"
  ]
};

function findValidExecutable(paths, cb) {
  if (paths.length === 0) {
    return cb(new Error("Couldn't locate executable at given paths."));
  }

  var loc = paths.shift();
  
  fs.stat(loc, function (err, stat) {
    if (stat && stat.isFile()) {
      cb(null, loc);
    } else {
      findValidExecutable(paths, cb);
    }
  });
}

module.exports.locate = function (searchPaths, cb) {
  var cmd = "ssh-keygen";
  
  which(cmd, function (err, res) {
    if (res) return cb(null, res);
    
    var execPaths = [];
    
    if (process.platform === "win32") {
      var extensions = process.env.PATHEXT.split(";");
      if (cmd.indexOf(".") !== -1) {
        extensions.unshift("");
      }
      
      for (var i = 0; i < searchPaths.length; ++i) {
        var execBase = path.resolve(searchPaths[i], cmd);
        
        for (var j = 0; j < extensions.length; ++j) {
          var execLoc = execBase + extensions[j];
          
          execPaths.push(execLoc);
        }
      }
    } else {
      execPaths = searchPaths.map(function (loc) {
        return path.resolve(loc, cmd);
      });
    }
    
    findValidExecutable(execPaths, cb);
  });
};

module.exports.generate = function (opts, cb) {
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  
  opts.additionalPaths = opts.additionalPaths || additionalPaths[process.platform] || [];
  
  module.exports.locate(opts.additionalPaths, function (err, loc) {
    if (err) return cb(err);
    
    var keyPath = temp.path();
    
    var args = ["-q", "-t", "rsa", "-f", keyPath, "-N", ""];
    if (opts.comment !== undefined) {
      args.push("-C", opts.comment);
    }
    if (opts.bits) {
      args.push("-b", opts.bits);
    }
    
    var done = false;
    var cp = spawn(loc, args, { stdio: "ignore" });
    
    cp.on("error", function () {
      fs.unlink(keyPath, function () { });
      fs.unlink(keyPath + ".pub", function () { });
      
      if (done) return;
      
      done = true;
      cb(new Error("An error occured while executing ssh-keygen."));
    });
    
    cp.on("close", function (code, signal) {
      if (done) {
        fs.unlink(keyPath, function () { });
        fs.unlink(keyPath + ".pub", function () { });
        
        return;
      }
      
      done = true;
      
      fs.readFile(keyPath, { encoding: "utf8" }, function (err, privateKey) {
        if (err) {
          fs.unlink(keyPath, function () { });
          fs.unlink(keyPath + ".pub", function () { });
          done = true;
          
          return cb(err);
        }
        
        fs.readFile(keyPath + ".pub", { encoding: "utf8" }, function (err, publicKey) {
          if (err) {
            fs.unlink(keyPath, function () { });
            fs.unlink(keyPath + ".pub", function () { });
            done = true;
            
            return cb(err);
          }
          
          done = true;
          fs.unlink(keyPath, function () { });
          fs.unlink(keyPath + ".pub", function () { });
          
          cb(null, {
            private: privateKey,
            public: publicKey
          })
        });
      });
    });
  });
};
