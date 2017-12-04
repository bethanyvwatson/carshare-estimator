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

  var convertTo24Hrs = function(hour, am0Pm1) {
    // Converts given hour to 24 hour time.
    // For noon and midnight, invert behavior for 12hr offset.
    var noonOrMidnight = hour == 12;
    return noonOrMidnight ? 
      hour + (12 * !am0Pm1 + am0Pm1) : 
      hour + (12 * am0Pm1);
  };

  var summedQuarterlyCharges = function(vueComponent) {
    // Calculates the cost of each quarter-hour (15 minute) segment for the described trip.
    // Returns a float, representing the total cost of the trip in dollars (the sum of all quarterly charges).
    // Time charges are influenced by: plan type, day of the week, time of day, and trip duration.
    
    var startDate = new Date(Date.parse(vueComponent.pickupDate));

    // Set the hours, converted to 24hr time to more easily detect nighttime hours.
    // TODO: 12 does not quite work for detecting midnight.
    startDate.setHours(convertTo24Hrs(vueComponent.pickupHour, vueComponent.pickupMeridian), vueComponent.pickupMin);

    // Each index represents a 15 minute chunk of this trip
    // For each chunk, we calculate the amount paid for that chunk.
    var usageArray = new Array((vueComponent.tripHours * 4) + (vueComponent.tripMins/60) * 4);

    // Empty arrays cannot be iterated upon.
    usageArray.fill(undefined);

    // Initialize shared variables for the loop.
    // Current means "in respect to the current iteration."
    var currentDate = startDate;
    var currentDayOfWeek = startDate.getDay();
    var consecutiveQuarterHours = 0;

    // Calculate the individual time cost for each 15 minute segment of the journey.
    // Store this cost at the index representing each segment.
    usageArray.forEach(function(curr, index, usageArray) {
      var costThisQuarter = 0;

      // For long trips, only 10 hours per day accrue hourly charges.
      // If we have not surpassed 10 hours in a 24 hr period, the hourly charge is normal.
      // Otherwise, accrue no additional charges until the next 24 hr period.
      if (consecutiveQuarterHours < 4 * _maxDailyHrsCharged) {
        costThisQuarter = parseFloat((isWeekend(currentDayOfWeek) ? vueComponent.weekendRate : vueComponent.weekdayRate)) * 0.25;
        if (_nighttimeHours.includes(currentDate.getHours())) {
          costThisQuarter = costThisQuarter * _nighttimeDiscountMultiplier;
        }
        
        consecutiveQuarterHours += 1;
      } else {
        consecutiveQuarterHours = consecutiveQuarterHours < _quartersPerDay ? 0 : consecutiveQuarterHours + 1;
      }

      // Increment the date by 15 mins for the next iteration.
      currentDate = new Date(currentDate.getTime() + _quarterHour);
      currentDayOfWeek = currentDate.getDay();

      // Persist the cost for this quarter hour.
      usageArray[index] = costThisQuarter;
    }, vueComponent);

    var chargesSum = usageArray.reduce(function(a, b) { return a + b; }, 0);
    return chargesSum;
  };

  var isWeekend = function(dayNumber) {
    // JavaScript Date.getDay() lists 5 and 6 as Sat and Sun.
    // TODO: Weekend days and hours are actually 5pm Fri - 5pm Sun
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
        return summedQuarterlyCharges(this);
      },
      weekdayRate: function() {
        // TODO: adjust for selected plan
        // Rates for Regular Plans is $4.95.
        // Rates for Emergency Plans is $7.95.
        return 5.00; 
      },
      weekendRate: function() { 
        // Weekend Rates are $1.00 more expensive than Weekday Rates.
        return this.weekdayRate + 1.00; 
      }
    },
    methods: {}
  });
}

