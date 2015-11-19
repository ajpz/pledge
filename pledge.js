var STATE_PENDING = 'pending',
	STATE_RESOLVED = 'resolved', 
	STATE_REJECTED = 'rejected'; 



function $Promise() {
	this.state = STATE_PENDING; 
	this.value = null; 
	this.handlerGroups = [];
}

$Promise.prototype.then = function( successCb, errorCb ) {
  var forwarder = defer(); 
	if ( typeof successCb !== 'function' ) successCb = undefined;
	else if ( this.state === STATE_RESOLVED ) successCb( this.value );

	if ( typeof errorCb !== 'function' ) errorCb = undefined;
	else if ( this.state === STATE_REJECTED ) errorCb( this.value );

  if (this.state === STATE_PENDING) {
  	this.handlerGroups.push( {
  		successCb: successCb,
  		errorCb: errorCb, 
      forwarder: forwarder
  	} );
  }

  return forwarder.$promise; 
}

$Promise.prototype.catch = function(errorCb) {
  return this.then(null, errorCb); 
}

function Deferral() {
	this.$promise = new $Promise(); 

} 

Deferral.prototype.resolve = function(data) {
	if(this.$promise.state === STATE_PENDING) {
		this.$promise.state = STATE_RESOLVED; 
		this.$promise.value = data; 
		this.$promise.handlerGroups.forEach( function( handlers ) {
			if ( handlers.successCb ) {
        try {
          var result = handlers.successCb( data ); 
          if (result.constructor && result.constructor === $Promise) {
            result.then(function(r){
              handlers.forwarder.resolve(r);
            }, function(r){
              handlers.forwarder.reject(r);
            });  
          } else {
            handlers.forwarder.resolve(result); 
          }

        } catch(error) {
          handlers.forwarder.reject(error); 
        }
      }
      else handlers.forwarder.resolve(data); 
		} );

    this.$promise.handlerGroups = []; 
	}
}

Deferral.prototype.reject = function(reason) {
	if(this.$promise.state === STATE_PENDING) {
		this.$promise.state = STATE_REJECTED; 
		this.$promise.value = reason; 

		this.$promise.handlerGroups.forEach( function( handlers ) {
			if ( handlers.errorCb ) {
        try {
          var result = handlers.errorCb( reason );
          if (result.constructor && result.constructor === $Promise) {
            result.then(function(r) {
              handlers.forwarder.resolve(r);
            }, function(r) {
              handlers.forwarder.reject(r); 
            })
          } else {
            handlers.forwarder.resolve(result); 
          }
          
        } catch(error) {
          handlers.forwarder.reject(error); 
        }
      }
      else handlers.forwarder.reject(reason); 
		} );  

    this.$promise.handlerGroups = [];
	}
}

function defer() {
	return new Deferral(); 
} 
