window.onload = function () {
  new Vue({
    el: '#estimator',
    data: {
      vehicleRate: '',
      milesTraveled: ''
    },
    computed: {
      cost: function() {
        var dollarsPerMile = parseFloat(this.vehicleRate)/100;
        var numMiles = parseFloat(this.milesTraveled);
        return dollarsPerMile * numMiles;
      }
    },
    methods: {}
  });
}
