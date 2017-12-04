window.onload = function () {
  const _maxDailyHrsCharged = 10;
  const _nighttimeHours = [23, 0, 1, 2, 3, 4, 5, 6];
  const _nighttimeDiscountMultiplier = .5;
  const _quarterHour = 15*6000;
  const _quartersPerDay = 4 * 24;
  const _taxMultiplier = 1.08;

  var mileageData = {
    vehicleRate: '',
    milesTraveled: ''
  };

  var timeData = {
    hours: [1,2,3,4,5,6,7,8,9,10,11,12],
    meridians: { 'AM': 0, 'PM': 1 },
    mins: ['00', '15', '30', '45'],
    pickupDate: '',
    pickupHour: '',
    pickupMin: '', 
    pickupMeridian: 0,
    tripHours: 0,
    tripMins: 0
  };

  var isWeekend = function(dayNumber) {
    // JavaScript Date.getDay() lists 5 and 6 as Sat and Sun
    return [5,6].includes(dayNumber);
  };

  new Vue({
    el: '#estimator',
    data: Object.assign(mileageData, timeData),
    computed: {
      cost: function() {
        // Returns a float representing the estimated cost of a trip, in dollars.
        // Total cost includes charges for: mileage, time used, fees, and taxes.
        return this.subtotal * _taxMultiplier || 0;        
      },
      mileageCharges: function() {
        // Returns a float representing the cost, in dollars, for mileage on this trip.
        // Each class of vehicle has a different cost per mile.
        // charges = per-mile-rate for selected vehicle type * total number of miles
        var dollarsPerMile = parseFloat(this.vehicleRate)/100;
        var numMiles = parseFloat(this.milesTraveled);
        return dollarsPerMile * numMiles;
      },
      subtotal: function() {
        // Returns a float representing the estimated cost of a trip, excluding taxes.
        // Subtotal cost includes charges for: mileage, time used, fees.
        // Fees are made up.
        var standardFees = 4.50;
        return parseFloat(this.mileageCharges + this.timeCharges + standardFees);
      },
      timeCharges: function() {
        // Retuns a float representing the cost, in dollars, for reserving a vehicle for the specified amount of time.
        // Time charges are influenced by: plan type, day of the week, time of day, and trip duration.
        var startDate = new Date(Date.parse(this.pickupDate));
        startDate.setHours(this.pickupHour + (12 * this.pickupMeridian), this.pickupMin);
        var currentDate = startDate;

        var startingDayOfWeek = startDate.getDay();
        var currentDayOfWeek = startingDayOfWeek;
        var consecutiveQuarterHours = 0;

        // Each index represents a 15 minute chunk of this trip
        // For each chunk, we calculate the amount paid for that chunk.
        var usageArray = new Array((this.tripHours * 4) + (this.tripMins/60) * 4);
        usageArray.fill(undefined);
        console.log(this.tripMins);
        console.log('mins:' +Math.min(0, 60.00/this.tripMins));
        console.log('len' + usageArray.length);
        usageArray.forEach(function(curr, index, usageArray) {
          var costThisQuarter = 0;

          // For long trips, only 10 hours per day accrue hourly charges.
          // If we have not surpassed 10 hours in a 24 hr period, the hourly charge is normal.
          // Otherwise, accrue no additional charges until the next 24 hr period.
          if (consecutiveQuarterHours < 4 * _maxDailyHrsCharged) {
            costThisQuarter = parseFloat((isWeekend(currentDayOfWeek) ? this.weekendRate : this.weekdayRate)) * 0.25;
            console.log(costThisQuarter);
            if (_nighttimeHours.includes(currentDate.getHours())) {
              costThisQuarter = costThisQuarter * _nighttimeDiscountMultiplier;
            }
            
            consecutiveQuarterHours += 1;
          } else {
            consecutiveQuarterHours = consecutiveQuarterHours < _quartersPerDay ? 0 : consecutiveQuarterHours + 1;
          }

          // Increment the date by 15 mins for the next iteration
          currentDate = new Date(currentDate.getTime() + _quarterHour);
          currentDayOfWeek = currentDate.getDay();

          // Persist the cost for this quarter hour
          usageArray[index] = costThisQuarter;
        }, this);

        var chargesSum = usageArray.reduce(function(a, b) { return a + b; }, 0);
        console.log(chargesSum);
        return chargesSum;
      },
      weekdayRate: function() {
        // Rates for Regular Plans is $4.95
        // Rates for Emergency Plans is $7.95
        return 5.00; 
      },
      weekendRate: function() { 
        // Weekend Rates are $1.00 more expensive than Weekday Rates
        return this.weekdayRate + 1.00; 
      }
    },
    methods: {}
  });
}

