window.onload = function() {
  /*
   * Returns a float representing the estimated cost of a trip, in dollars.
   * Total cost includes charges for: mileage, time used, fees, and taxes.
   */
  var calculateRate = function () {
    var totalFees = calculateTimeCharges() + calculateMileageCharges() + calculateFees();
    totalFees = totalFees + calculateTaxes(totalFees);
    return totalFees;
  };
  
  /*
   * Retuns a float representing the cost, in dollars, for reserving a vehicle for the specified amount of time.
   * Time charges are influenced by: plan type, day of the week, time of day, and trip duration.
   */
  var calculateTimeCharges = function() {
    var pickupDate = new Date($('#pickup-date').val());
    return 20.56;
  };
  
  /*
   * Returns a float representing the cost, in dollars, for mileage on this trip.
   * Each class of vehicle has a different cost per mile.
   * charges = per-mile-rate for selected vehicle * total number of miles
   */
  var calculateMileageCharges = function() {
    var dollarsPerMile = parseFloat($('#vehicle-types option:selected').val())/100;
    var numMiles = parseFloat($('#miles-traveled').val());
    return dollarsPerMile * numMiles;
  };
  
  /*
   * Returns a float representing the dollar amount of taxes assessed for the trip's subtotal.
   * Taxes are estimated at 8% of the total transaction.
   */
  var calculateTaxes = function(totalBeforeTaxes) {
    return totalBeforeTaxes * .08;
  };
  
  /*
   * Fees are hardcoded and made up.
   */
  var calculateFees = function() {
    return 5.00;
  };
  
  var displayEstimatedCost = function(e) {
    if (e) { e.preventDefault(); }
    var estimateString = '$'+ calculateRate().toString();
    $('#estimated-cost').html(estimateString);
  };
  
  $('#rates-form').on('submit', displayEstimatedCost)
};
