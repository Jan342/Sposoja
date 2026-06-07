var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var packageSchema = new Schema({
    'name': String,
    'location': String,
    'boxId': {
        type: String,
        default: ''
    },
    'rentedBy': {
        type: Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    'racketLimit': {
        type: Number,
        default: 0
    },
    'club': {
        type: Schema.Types.ObjectId,
        ref: 'club'
    }
});

module.exports = mongoose.model('package', packageSchema);
