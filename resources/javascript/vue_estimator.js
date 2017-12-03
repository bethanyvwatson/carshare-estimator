window.onload = function () {
  const _taxMultiplier = 1.08;

  var mileageData = {
    vehicleRate: '',
    milesTraveled: ''
  };

  var timeData = {
    hours: [1,2,3,4,5,6,7,8,9,10,11,12],
    pickupDate: '01/01/2017',
    pickupHour: ''
  };

  new Vue({
    el: '#estimator',
    data: Object.assign(mileageData, timeData),
    computed: {
      cost: function() {
        // Returns a float representing the estimated cost of a trip, in dollars.
        // Total cost includes charges for: mileage, time used, fees, and taxes.
        return this.subtotal * _taxMultiplier;        
      },
      mileageCharges: function() {
        // Returns a float representing the cost, in dollars, for mileage on this trip.
        // Each class of vehicle has a different cost per mile.
        // charges = per-mile-rate for selected vehicle * total number of miles
        var dollarsPerMile = parseFloat(this.vehicleRate)/100;
        var numMiles = parseFloat(this.milesTraveled);
        return dollarsPerMile * numMiles;
      },
      subtotal: function() {
        // Returns a float representing the estimated cost of a trip, excluding taxes.
        // Subotal cost includes charges for: mileage, time used, fees.
        // Fees are made up.
        var standardFees = 4.50;
        return parseFloat(this.mileageCharges + this.timeCharges + standardFees);
      },
      timeCharges: function() {
        // Retuns a float representing the cost, in dollars, for reserving a vehicle for the specified amount of time.
        // Time charges are influenced by: plan type, day of the week, time of day, and trip duration.
        return parseInt(this.pickupDate) + parseInt(this.pickupHour);
      },
    },
    methods: {}
  });
}
