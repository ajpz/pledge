var STATE_PENDING = 'pending',
  STATE_RESOLVED = 'resolved', 
  STATE_REJECTED = 'rejected'; 


// Promise constructor
function $Promise() {
  this.state = STATE_PENDING; 
  this.value = undefined; 
  this.handlerGroups = [];
        this.updateCbs = [];
}

// Promise.then method
// accepts 3 callbacks, or null for no handler
$Promise.prototype.then = function( successCb, errorCb, updateCb ) {
  var forwarder = defer(); 

  // if our success handler is not a function, make it falsy
  if ( typeof successCb !== 'function' ) successCb = undefined;
        // otherwise, if we've resolved, call it
  else if ( this.state === STATE_RESOLVED ) successCb( this.value );

  // same for the error/reject callback
  if ( typeof errorCb !== 'function' ) errorCb = undefined;
  else if ( this.state === STATE_REJECTED ) errorCb( this.value );

  // if we received an update callback, add it to our update callback array
  if ( typeof updateCb === 'function' ) this.updateCbs.push( updateCb );

  // if we're pending, add the other callbacks to our handler array
  if (this.state === STATE_PENDING) {
    this.handlerGroups.push( {
      successCb: successCb,
      errorCb: errorCb, 
      forwarder: forwarder
    } );
  }

  // return the forward promise
  return forwarder.$promise; 
}

// Promise.catch method
// convenience function for Promise.then( null, cb );
$Promise.prototype.catch = function(errorCb) {
  return this.then(null, errorCb); 
}

// Deferral constructor
function Deferral() {
  this.$promise = new $Promise(); 

} 

// Deferral.resolve
// resolves the attached promise with some data
Deferral.prototype.resolve = function(data) {
    // make sure we're pending
  if(this.$promise.state === STATE_PENDING) {
    this.$promise.state = STATE_RESOLVED; 
    this.$promise.value = data; 

    this.$promise.handlerGroups.forEach( function( handlers ) {
      if ( handlers.successCb ) {
        try {
          // get the result of the success callback
          var result = handlers.successCb( data ); 

          // if it's a promise, forward it to our forwarder's promise
          if (result.constructor && result.constructor === $Promise) {
            result.then(function(r){
              handlers.forwarder.resolve(r);
            }, function(r){
              handlers.forwarder.reject(r);
            });  

          // otherwise just resolve with the result
          } else {
            handlers.forwarder.resolve(result); 
          }

        // if there's an error, reject with the error received
        } catch(error) {
          handlers.forwarder.reject(error); 
        }
      }
      
      // if we have no success handler, forward the data
      else handlers.forwarder.resolve(data); 
    } );

    // clear out handler groups
    this.$promise.handlerGroups = []; 
  }
}

Deferral.prototype.reject = function(reason) {
  // check that we're pending
  if(this.$promise.state === STATE_PENDING) {
    this.$promise.state = STATE_REJECTED; 
    this.$promise.value = reason; 

    this.$promise.handlerGroups.forEach( function( handlers ) {
      if ( handlers.errorCb ) {
        try {
          // get the result of the error callback
          var result = handlers.errorCb( reason );

          // if it's a promise, forward it through
          if (result.constructor && result.constructor === $Promise) {
            result.then(function(r) {
              handlers.forwarder.resolve(r);
            }, function(r) {
              handlers.forwarder.reject(r); 
            })

          // otherwise just resolve
          } else {
            handlers.forwarder.resolve(result); 
          }
          
        // if there's an error, reject the next promise
        } catch(error) {
          handlers.forwarder.reject(error); 
        }
      }
      
      // if we have no error handler, forward the error
      else handlers.forwarder.reject(reason); 
    } );  

    // clear out our handler groups
    this.$promise.handlerGroups = [];
  }
}

// Deferral.notify
// calls the update handlers on our promise
Deferral.prototype.notify = function(info) {
  if ( this.$promise.state === STATE_PENDING ) {
    if ( this.$promise.updateCbs.length > 0 ) {
      this.$promise.updateCbs.forEach( function( updateCb ) {
        updateCb( info );
      } );
    }
  }
}

function defer() {
  return new Deferral(); 
} 
