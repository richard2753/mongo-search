var crypto = require('crypto');
var sort = require('./sort.js');
var sortBy = sort.sortBy;
var descending = sort.descending;

var from = function(exchangeRate, rates, response) {
  var convert = function(price, ex) {
    return Math.round(price * ex * 100)/100;
  }
  
  if(rates[0] instanceof Array) {
    rates.forEach(function(result) { result.forEach(function (rate) { rate.convertedPrice *= convert(rate.convertedPrice,exchangeRate) }) })
  } else {
    rates.forEach(function(result) { result.convertedPrice = convert(result.convertedPrice, exchangeRate); })
  }

  var etag = crypto.createHash('md5');
  etag.update(JSON.stringify(rates));
  response.setHeader('ETag', etag.digest('hex'));
  response.send(rates);
}

var sort = function(request, response, next) {
  request.rateResponse.sort(request.sort.descending
    ? descending(sortBy[request.sort.order])
    : sortBy[request.sort.order]);
  next(); 
}

var constructResponse = function(request, response, next) {
  var exchangeRate = request.exchangeRates[request.currency];
  var page = request.page.number; 
  var size = request.page.size;
  if(page > 1) {
    response.setHeader('X-Prev', request.getUrlForPage(page-1));
  }
  if(page*size < request.rateResponse.length) {
    response.setHeader('X-Next', request.getUrlForPage(page+1));
  }
  response.setHeader('X-HotelsAvailable', request.rateResponse.length);
  response.setHeader('X-HotelCount', request.ids.length);
  from(exchangeRate, request.rateResponse.slice((page-1)*size, page*size), response);
  next();
}

module.exports.from = from;
module.exports.constructResponse = function() {
  return [
           sort,
           constructResponse
         ];
}

