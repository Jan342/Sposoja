var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var packageSchema = new Schema({
    'name': String,
    'location': String,
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
