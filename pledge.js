var STATE_PENDING = 'pending',
	STATE_RESOLVED = 'resolved', 
	STATE_REJECTED = 'rejected'; 



function $Promise() {
	this.state = STATE_PENDING; 
	this.value = null; 
}

function Deferral() {
	this.$promise = new $Promise(); 

} 

Deferral.prototype.resolve = function(data) {
	if(this.$promise.state === STATE_PENDING) {
		this.$promise.state = STATE_RESOLVED; 
		this.$promise.value = data; 
	}
}

Deferral.prototype.reject = function(reason) {
	if(this.$promise.state === STATE_PENDING) {
		this.$promise.state = STATE_REJECTED; 
		this.$promise.value = reason; 
	}
}

function defer() {
	return new Deferral(); 
} 