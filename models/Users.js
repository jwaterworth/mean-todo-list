var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
    username: { type: String, lowercase: true, unique: true },
    hash: String,
    salt: String
});

const iterations = 1000;
const keyLength = 64;

UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, iterations, keyLength).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
    console.log(password);
    var hash = crypto.pbkdf2Sync(password, this.salt, iterations, keyLength).toString('hex');
    console.log(hash);
    return this.hash === hash;
};

UserSchema.methods.generateJWT = function() {
    var today = new Date();
    var exp = new Date(today);

    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        _id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000)
    }, 'SECRET');
}

mongoose.model('User', UserSchema);