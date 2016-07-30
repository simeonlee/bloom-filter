
var Bloomfilter = function() {
  this.bitArray = [0,0,0,0,0,0,0,0,0,0];

};

Bloomfilter.prototype.hashCode = function(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash % this.bitArray.length;
};

Bloomfilter.prototype.djb2Code = function(str){
    var hash = 5381;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return hash % this.bitArray.length;
};

Bloomfilter.prototype.register = function(input) {
  var firstHash = this.hashCode(input);
  var secondHash = this.djb2Code(input);

  for (var i = 0; i < bitArray.length; i++) {
    if (i === firstHash || i === secondHash) {
      bitArray[i] = 1;
    }
  }
};

Bloomfilter.prototype.retrieve = function(input) {
  var firstHash = this.hashCode(input);
  var secondHash = this.djb2Code(input);

  for (var i = 0; i < bitArray.length; i++) {
    if (i === firstHash || i === secondHash) {
      return true;
    }
  }

  return false;
};

var HashTable = function() {
  this._limit = 8;
  this._storage = LimitedArray(this._limit);
  this.tupleCount = 0;
  this.bloomfilter = new Bloomfilter();
};

HashTable.prototype.insert = function(k, v) {
  var index = getIndexBelowMaxForKey(k, this._limit);
  var storage = this._storage;
  var bucket;
  var skipNewBucketStorage = false;
  this.bloomfilter.register(k);

  // Create a tuple
  var tuple = LimitedArray(this._limit);
  tuple.set(0, k);
  tuple.set(1, v);
  this.tupleCount++;

  if ( storage.get(index, this._limit) !== undefined ) {
    bucket = storage.get(index, this._limit);

    var bucketLength = 0;
    bucket.each(function(tuple, i, bucket) {
      bucketLength++;
    });
    
    if ( bucketLength > 0 ) { // bucket already has some stuff in it

      // This finds the tuple if it exists already
      // and replaces the existing value for the key
      // with a new value
      bucket.each(function(tuple, i, bucket) {
        var key = tuple.get(0, this._limit);
        if ( key === k ) {
          tuple.set(1, v);
          skipNewBucketStorage = true;
        }
      });
      if (!skipNewBucketStorage) {
        // Insert new tuple in empty bucket
        bucket.set(bucketLength, tuple);
      }
    }
  } else if ( storage.get(index, this._limit) === undefined ) {
    // If the bucket for the given index does not exist,
    // initialize it
    bucket = LimitedArray();
    storage.set(index, bucket);
    bucket.set(0, tuple);
    console.log("This:");
    console.log(this);
    console.log("This._storage.get(index, this._limit):");
    console.log(this._storage.get(index, this._limit));
    console.log("This._storage.get(index, this._limit).get(0, this._limit):");
    console.log(this._storage.get(index, this._limit).get(0, this._limit));
    console.log("This._storage.get(index, this._limit).get(0, this._limit).get(0, this._limit):");
    console.log(this._storage.get(index, this._limit).get(0, this._limit).get(0, this._limit));
    console.log("This._storage.get(index, this._limit).get(0, this._limit).get(1):");
    console.log(this._storage.get(index, this._limit).get(0, this._limit).get(1));
  }

  if (this.tupleCount / this._limit >= .75) {
    this._limit *= 2;
  }
};

HashTable.prototype.retrieve = function(k) {
  var index = getIndexBelowMaxForKey(k, this._limit);
  var storage = this._storage;
  var bucket = storage.get(index, this._limit);
  var res;
  var bloom = this.bloomfilter.retrieve(k);
  // debugger;
  if (bloom) {
    bucket.each(function(tuple, i, bucket) {
      var key = tuple.get(0, this._limit);
      var val = tuple.get(1);
      if ( key === k ) {
        res = val;
      }
    });
    return res;
  } else {
    return "The key was not found in the hash table.";
  }
};

HashTable.prototype.remove = function(k) {
  var index = getIndexBelowMaxForKey(k, this._limit);
  var bucket = this._storage.get(index, this._limit);

  bucket.each(function(tuple, i, bucket) {
    var key = tuple.get(0, this._limit);
    if (key === k) {
      Array.prototype.splice.call(bucket, i, 1);
    }
  });

  if (this.tupleCount / this._limit <= .75) {
    this._limit /= 2;
  }
};



/*
 * Complexity: What is the time complexity of the above functions?
 HELPERS ARE BELOW
 */


/*
 ********** NOTE: **********
 * Do not edit this code unless you see a bug!
 */


// This class represents an array with limited functionality and a maximum size.
// It will ensure that you don't accidentally try to use up too much space.
//
// Usage:
//   limitedArray.set(3, 'hi');
//   limitedArray.get(3); // returns 'hi'

var LimitedArray = function(limit) {
  var storage = [];

  var limitedArray = {};
  limitedArray.get = function(index, limit) {
    checkLimit(index, limit);
    return storage[index];
  };
  limitedArray.set = function(index, value) {
    checkLimit(index);
    storage[index] = value;
  };
  limitedArray.each = function(callback) {
    for (var i = 0; i < storage.length; i++) {
      callback(storage[i], i, storage);
    }
  };

  var checkLimit = function(index, limit) {
    if (typeof index !== 'number') {
      throw new Error('setter requires a numeric index for its first argument');
    }
    if (limit <= index) {
      throw new Error('Error trying to access an over-the-limit index');
    }
  };

  return limitedArray;
};

// This is a "hashing function". You don't need to worry about it, just use it
// to turn any string into an integer that is well-distributed between the
// numbers 0 and `max`
var getIndexBelowMaxForKey = function(str, max) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
    hash = Math.abs(hash);
  }
  return hash % max;
};

/*
 * Complexity: What is the time complexity of the above functions?
 */


