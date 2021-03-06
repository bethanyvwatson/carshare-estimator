window.onload = function () {
  const _maxDailyHrsCharged = 10;
  const _nighttimeHours = [23, 0, 1, 2, 3, 4, 5, 6];
  const _nighttimeDiscountMultiplier = .5;
  const _quarterHour = 15*6000;
  const _quartersPerDay = 4 * 24;
  const _taxMultiplier = 0.08;

  var mileageData = {
    vehicleRate: '',
    milesTraveled: ''
  };

  var timeData = {
    hours: [1,2,3,4,5,6,7,8,9,10,11,12],
    meridians: { 'AM': 0, 'PM': 1 },
    milesTraveled: 0,
    mins: ['00', '15', '30', '45'],
    pickupDate: '',
    pickupHour: '12',
    pickupMin: '00', 
    pickupMeridian: 0,
    plans: { "It's My Car": 0, 'Just In Case': 3 },
    tripHours: 0,
    tripMins: '00'
  };

  var convertTo24Hrs = function(hour, am0Pm1) {
    // Converts given hour to 24 hour time.
    // For noon and midnight, invert behavior for 12hr offset.
    var noonOrMidnight = hour == 12;
    return noonOrMidnight ? 
      hour + (12 * am0Pm1) :
      hour + (12 * !am0Pm1 + am0Pm1); 
  };

  var isWeekend = function(dayNumber, hour) {
    // Weekend days and hours are actually 5pm Fri - 5pm Sun
    var lateFriday = dayNumber == 4 && hour >= 5;
    var saturday = dayNumber == 5;
    var earlySunday = dayNumber == 6 && hour < 5;

    return lateFriday || saturday || earlySunday;
  };

  var summedQuarterlyCharges = function(vueComponent) {
    // Calculates the cost of each quarter-hour (15 minute) segment for the described trip.
    // Returns a float, representing the total cost of the trip in dollars (the sum of all quarterly charges).
    // Time charges are influenced by: plan type, day of the week, time of day, and trip duration.
    
    var startDate = new Date(Date.parse(vueComponent.pickupDate));

    // Set the hours, converted to 24hr time to more easily detect nighttime hours.
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

    // Track consecutive rental hours so that we can only charge for 10 out of every 24 hours.
    var consecutiveQuarterHours = 0;

    // Calculate the individual time cost for each 15 minute segment of the journey.
    // Store this cost at the index representing each segment.
    usageArray.forEach(function(curr, index, usageArray) {
      var costThisQuarter = 0;

      // For long trips, only 10 hours per day accrue hourly charges.
      if (consecutiveQuarterHours < (4 * _maxDailyHrsCharged)) {
        // If we have not surpassed 10 hours in a 24 hr period, the hourly charge is normal.

        var currentHour = currentDate.getHours();
        
        // Calculate cost based on weekend or weekday rates
        if (isWeekend(currentDayOfWeek, currentHour)) {
          costThisQuarter = vueComponent.weekendRate * 0.25;
        } else {
          costThisQuarter = vueComponent.weekdayRate * 0.25;
        }

        // Apply nighttime discount
        if (_nighttimeHours.includes(currentHour)) {
          costThisQuarter = costThisQuarter * _nighttimeDiscountMultiplier;
        }
        
        consecutiveQuarterHours += 1;
      } else {
        // Otherwise, accrue no additional charges until the next 24 hr period.
        // Reset consecutive hours after 24 hours have passed.
        consecutiveQuarterHours = consecutiveQuarterHours > _quartersPerDay ? 0 : consecutiveQuarterHours + 1;
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

  new Vue({
    el: '#estimator',
    data: Object.assign(mileageData, timeData, { pricingPlanModifier: '' }),
    computed: {
      cost: function() {
        // Returns a float representing the estimated cost of a trip, in dollars.
        // Total cost includes charges for: mileage, time used, fees, and taxes.
        return parseFloat(this.subtotal) + parseFloat(this.taxes) || 0;        
      },
      mileageCharges: function() {
        // Returns a float representing the cost, in dollars, for mileage on this trip.
        // Each class of vehicle has a different cost per mile.
        // charges = per-mile-rate for selected vehicle type * total number of miles
        var dollarsPerMile = parseFloat(this.vehicleRate)/100;
        var numMiles = parseFloat(this.milesTraveled);
        return dollarsPerMile * numMiles || 0;
      },
      standardFees: function() { return 4.50; },
      subtotal: function() {
        // Returns a float representing the estimated cost of a trip, excluding taxes.
        // Subtotal cost includes charges for: mileage, time used, fees.
        // Fees are made up.
        return parseFloat(this.mileageCharges) + parseFloat(this.timeCharges) + parseFloat(this.standardFees);
      },
      taxes: function() { return this.subtotal * _taxMultiplier; },
      timeCharges: function() {
        return summedQuarterlyCharges(this);
      },
      weekdayRate: function() {
        // Rates for Regular Plans is $4.95.
        // Rates for Emergency Plans is $7.95.
        return 4.95 + this.pricingPlanModifier; 
      },
      weekendRate: function() { 
        // Weekend Rates are $1.00 more expensive than Weekday Rates.
        return this.weekdayRate + 1.00; 
      }
    },
    methods: {
      toCashString: function(amount) {
        return parseFloat(amount).toFixed(2);
      }
    }
  });
}

