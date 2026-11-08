// Shift errors
const SHIFT_ERRORS = Object.freeze({
  SHIFT_NOT_FOUND: { status: 404, code: 'SHIFT_NOT_FOUND', message: 'Không tìm thấy ca làm việc' },
  SCHEDULE_NOT_FOUND: { status: 404, code: 'SCHEDULE_NOT_FOUND', message: 'Không tìm thấy lịch làm việc' },
  INVALID_TIME_RANGE: { status: 400, code: 'INVALID_TIME_RANGE', message: 'Giờ kết thúc ca phải sau giờ bắt đầu' },
  DUPLICATE_SHIFT_NAME: { status: 409, code: 'DUPLICATE_SHIFT_NAME', message: 'Tên ca làm việc đã tồn tại' },
  NAME_REQUIRED: { status: 400, code: 'NAME_REQUIRED', message: 'Tên ca làm việc là bắt buộc' },
  START_TIME_REQUIRED: { status: 400, code: 'START_TIME_REQUIRED', message: 'Giờ bắt đầu là bắt buộc' },
  END_TIME_REQUIRED: { status: 400, code: 'END_TIME_REQUIRED', message: 'Giờ kết thúc là bắt buộc' },
});

module.exports = { SHIFT_ERRORS };

