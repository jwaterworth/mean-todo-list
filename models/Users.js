var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

const iterations = 1000;
const keyLength = 64; 

var UserSchema = new mongoose.Schema({
    username: { type: String, lowercase: true, unique: true },
    hash: String,
    salt: String
});

UserSchema.methods.setPassword = password => {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, iterations, keyLength).toString('hex');
};

UserSchema.methods.validPassword = password => {
    var hash = crypto.pbkdf2Sync(password, this.salt, iterations, keyLength);

    return this.hash === hash;
};

UserSchema.methods.generateJWT = () => {
    var today = new Date();
    var exp = new Date(today);

    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        _id: this._id,
        username: this.user,
        exp: parseInt(exp.getTime() / 1000)
    }, 'SECRET');
}

mongoose.model('User', UserSchema);