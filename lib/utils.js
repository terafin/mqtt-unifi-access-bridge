const accessURL = process.env.ACCESS_URL

module.exports.generateURL = function(suffix) {
    return '' + accessURL + suffix
}