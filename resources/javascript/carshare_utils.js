var CarshareCalculator = {
  maxDailyHrsCharged: 10,
  nighttimeHours: [23, 0, 1, 2, 3, 4, 5, 6],
  nighttimeDiscountMultiplier: .5,
  quarterHour: 15*6000,
  quartersPerDay: 4 * 24,
  standardFees: 4.50,
  taxMultiplier: 0.08,
  weekendRateSurcharge: 1.00,

  applyNighttimeDiscount: function(costThisQuarter, hour) {
    return this.nighttimeHours.includes(hour) ? 
      costThisQuarter * this.nighttimeDiscountMultiplier :
      costThisQuarter;
  },

  // Returns a float representing the cost, in dollars, for mileage on this trip.
  // Each class of vehicle has a different cost per mile.
  // charges = per-mile-rate for selected vehicle type * total number of miles
  calculateMileageCharges: function(vehicleRate, milesTraveled) {
    var dollarsPerMile = parseFloat(vehicleRate)/100;
    var numMiles = parseFloat(milesTraveled);

    return dollarsPerMile * numMiles || 0;
  },

  calculateTaxes: function(amount) {
    return amount * this.taxMultiplier;
  },

  // Converts given hour to 24 hour time.
  // For noon and midnight, invert behavior for 12hr offset.
  convertTo24Hrs: function(hour, am0Pm1) {
  var noonOrMidnight = hour == 12;

  return noonOrMidnight ? 
    hour + (12 * !am0Pm1 + am0Pm1) : 
    hour + (12 * am0Pm1);
  },

  // Weekend days and hours are actually 5pm Fri - 5pm Sun
  isWeekend: function(dayNumber, hour) {
    var lateFriday = dayNumber == 4 && hour >= 5;
    var saturday = dayNumber == 5;
    var earlySunday = dayNumber == 6 && hour < 5;

    return lateFriday || saturday || earlySunday;
  },

  // Calculates the cost of each quarter-hour (15 minute) segment for the described trip.
  // Returns a float, representing the total cost of the trip in dollars (the sum of all quarterly charges).
  // Time charges are influenced by: plan type, day of the week, time of day, and trip duration.
  calculateTimeCharges: function(weekdayRate, tripInformation) {   
    var weekdayRate = weekdayRate;
    var tripInformation = tripInformation;

    var startDate = new Date(Date.parse(tripInformation.pickupDate));

    // Set the hours, converted to 24hr time to more easily detect nighttime hours.
    startDate.setHours(this.convertTo24Hrs(tripInformation.pickupHour, tripInformation.pickupMeridian), tripInformation.pickupMin);

    // Each index represents a 15 minute chunk of this trip
    // For each chunk, we calculate the amount paid for that chunk.
    var quarterHoursArray = new Array((tripInformation.tripHours * 4) + (tripInformation.tripMins/60) * 4);

    // Empty arrays cannot be iterated upon.
    quarterHoursArray.fill(undefined);

    // Initialize shared variables for the loop.
    // Current means "in respect to the current iteration."
    var currentDate = startDate;
    var currentDayOfWeek = startDate.getDay();

    // Track consecutive rental hours so that we can only charge for 10 out of every 24 hours.
    var consecutiveQuarterHours = 0;

    // Calculate the individual time cost for each 15 minute segment of the journey.
    // Store this cost at the index representing each segment.
    quarterHoursArray.forEach(function(curr, index, quarterHoursArray) {

      // For long trips, only 10 hours per day accrue hourly charges.
      // If we have not surpassed 10 hours in a 24 hr period, the hourly charge is normal.
      // Otherwise, accrue no additional charges until the next 24 hr period.
      var passed10Hrs = consecutiveQuarterHours < (4 * this.maxDailyHrsCharged);
      if (passed10Hrs) {
        var costThisQuarter = this.calculateCostThisQuarter(weekdayRate, currentDayOfWeek, currentDate.getHours());
        consecutiveQuarterHours += 1;
      } else {
        var costThisQuarter = 0;
        var passed24Hrs = consecutiveQuarterHours > this.quartersPerDay;

        // Reset consecutive hours after 24 hours have passed.        
        consecutiveQuarterHours = passed24Hrs ? 0 : consecutiveQuarterHours + 1;
      }

      // Persist the cost for this quarter hour.
      quarterHoursArray[index] = costThisQuarter;

      // Increment the date by 15 mins for the next iteration.
      currentDate = new Date(currentDate.getTime() + this.quarterHour);
      currentDayOfWeek = currentDate.getDay();
    }, this);

    var chargesSum = quarterHoursArray.reduce(function(a, b) { return a + b; }, 0);
    return chargesSum;
  },

  // Calculate cost based on weekend, weekday, and nighttime rates.
  calculateCostThisQuarter: function(weekdayRate, weekday, hour) {
    var cost = 0;
    var rate = this.isWeekend(weekday, hour) ? (weekdayRate + this.weekendRateSurcharge) : weekdayRate;

    cost = rate * 0.25;
    cost = this.applyNighttimeDiscount(cost, hour);

    return cost;
  }
};