var STATE_PENDING = 'pending',
	STATE_RESOLVED = 'resolved', 
	STATE_REJECTED = 'rejected'; 



function $Promise() {
	this.state = STATE_PENDING; 
	this.value = null; 
        this.handlerGroups = [];
}

$Promise.prototype.then = function( successCb, errorCb ) {
  if ( typeof successCb !== 'function' ) successCb = undefined;
  else if ( this.state === STATE_RESOLVED ) successCb( this.value );

  if ( typeof errorCb !== 'function' ) errorCb = undefined;
  else if ( this.state === STATE_REJECTED ) errorCb( this.value );

  this.handlerGroups.push( {
    successCb: successCb,
    errorCb: errorCb
  } );
}

function Deferral() {
	this.$promise = new $Promise(); 

} 

Deferral.prototype.resolve = function(data) {
	if(this.$promise.state === STATE_PENDING) {
		this.$promise.state = STATE_RESOLVED; 
		this.$promise.value = data; 

                this.$promise.handlerGroups.forEach( function( handlers ) {
                  if ( handlers.successCb ) handlers.successCb( data );
                } );
	}
}

Deferral.prototype.reject = function(reason) {
	if(this.$promise.state === STATE_PENDING) {
		this.$promise.state = STATE_REJECTED; 
		this.$promise.value = reason; 

                this.$promise.handlerGroups.forEach( function( handlers ) {
                  if ( handlers.errorCb ) handlers.errorCb( reason );
                } );  
	}
}

function defer() {
	return new Deferral(); 
} 
