var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var lockerLogSchema = new Schema({
    'user': {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    'racket': {
        type: Schema.Types.ObjectId,
        ref: 'racket',
        required: true
    },
    'package': {
        type: Schema.Types.ObjectId,
        ref: 'package',
        required: true
    },
    'club': {
        type: Schema.Types.ObjectId,
        ref: 'club',
        required: true
    },
    'action': {
        type: String,
        enum: ['izposoja', 'vrnitev'],
        required: true
    },
    'timestamp': {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('lockerLog', lockerLogSchema);
