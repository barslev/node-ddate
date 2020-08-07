const tap = require('tap');
const DDate = require('.');

// No touchy ANY of these values - they're specifically set to 2019-12-09T05:04:38.690Z
// (because that's when I started writing this test)
tap.context.fromNothing = new DDate();
tap.context.fromNumber = new DDate(1575867878690);
tap.context.fromString = new DDate('2019-12-09T05:04:38.690Z');
tap.context.plainDate = new Date(1575867878690);
tap.context.fromPlainDate = new DDate(tap.context.plainDate);
tap.context.fromErisianDate = new DDate(tap.context.fromPlainDate);
tap.context.fromClone = tap.context.fromErisianDate.clone();
// All of these dates (standard and Erisian) SHOULD represent the same time, except for `fromNothing`

tap.test('object creators', async t => {
	const checkObject = (obj, source) => {
		if (!obj || !(obj instanceof DDate)) {
			const stringed = Reflect.apply(Object.prototype.toString, obj, []);
			const error = `${source} produced ${stringed} instead of DDate instance`;
			t.bailout(new TypeError(error));
		}
		else {
			t.pass(`${source} produces a DDate instance`);
		}
	};
	checkObject(
		t.context.fromNothing,
		'empty constructor call'
	);
	checkObject(
		t.context.fromNumber,
		'constructor call with number'
	);
	checkObject(
		t.context.fromString,
		'constructor call with javascript Date-formatted string'
	);
	checkObject(
		t.context.fromPlainDate,
		'constructor call with standard Date object'
	);
	checkObject(
		t.context.fromErisianDate,
		'constructor call with another DDate object'
	);
	checkObject(
		t.context.fromClone,
		'call to instance.clone()'
	);
});
tap.test('internal Date object', async t => {
	t.ok(
		t.context.fromNumber._thuddite,
		'constructor call with number has internal object'
	);
	t.same(
		t.context.fromNumber._thuddite,
		t.context.fromString._thuddite,
		'matching number and string constructor calls produce matching dates'
	);
	t.isNot(
		t.context.fromNumber._thuddite,
		t.context.fromString._thuddite,
		'matching number and string constructor calls do NOT produce the same object'
	);
	t.is(
		t.context.fromNothing._thuddite,
		t.context.fromNothing.thuddite,
		'internal getter returns the right object'
	);
	t.is(
		t.context.fromPlainDate.thuddite,
		t.context.plainDate,
		'constructor call with Date wraps the given object'
	);
	t.isNot(
		t.context.fromErisianDate.thuddite,
		t.context.fromPlainDate.thuddite,
		'constructor call on DDate object clones the internal date'
	);
	t.same(
		t.context.fromErisianDate.thuddite,
		t.context.fromPlainDate.thuddite,
		'constructor call on DDate object returns equivalent clone of internal date'
	);
});
tap.test('date conversion', async t => {
	const fnord = Object.freeze(t.context.fromClone.fnord);
	const formatted = t
		.context
		.fromClone
		.format('[%A] [%a] [%B] [%b] [%C] [%d] [%j] [%m] [%n] [%t] [%u] [%W] [%y] [%Y]');
	t.is(
		fnord.year,
		3185,
		'2019 CE (GRE) is 3185 YOLD'
	);
	t.is(
		fnord.monthName,
		'The Aftermath',
		'December is in The Aftermath'
	);
	t.is(
		fnord.month,
		5,
		'The Aftermath is month #5'
	);
	t.is(
		fnord.day,
		51,
		'December 9 is 51 The Aftermath'
	);
	t.is(
		fnord.dayName,
		'Pungenday',
		'51 The Aftermath is Pungenday'
	);
	t.is(
		fnord.dayOfWeek,
		3,
		'Pungenday is the third day of the week'
	);
	t.is(
		fnord.tibs,
		false,
		"51 The Aftermath is not St. Tib's Day"
	);
	t.is(
		formatted,
		"[Pungenday] [PD] [The Aftermath] [Afm] [31] [51] [343] [5] [\n] [\t] [3] [2] [85] [3185]",
		'string formatting returns the right values'
	);
});
tap.test('modifying internal date objects', async t => {
	const d = t.context.fromNothing;
	const i = d.thuddite;
	i.setFullYear(2020);
	i.setMonth(1);
	i.setDate(29);
	const fnord = d.fnord;
	const formatted = d.format('[%A] [%a] [%B] [%b] [%C] [%d] [%j] [%m] [%n] [%t] [%u] [%W] [%y] [%Y]');
	const expected = "[St. Tib's Day] [St Tib] [Chaos] [Chs] [31] [59.5] [59.5] [1] [\n] [\t] [0] [0] [86] [3186]";
	t.is(
		fnord.year,
		3186,
		'2020 CE (GRE) is 3186 YOLD'
	);
	t.is(
		fnord.monthName,
		'Chaos',
		'February is in Chaos'
	);
	t.is(
		fnord.month,
		1,
		'Chaos is month #1'
	);
	t.is(
		fnord.day,
		59.5,
		"St. Tib's Day is the 59.5th day"
	);
	t.is(
		fnord.dayName,
		"St. Tib's Day",
		"St. Tib's Day is St. Tib's Day"
	);
	t.is(
		fnord.dayOfWeek,
		0,
		"St. Tib's Day is outside of the week"
	);
	t.is(
		fnord.tibs,
		true,
		"59.5 Chaos is St. Tib's Day"
	);
	t.is(
		formatted,
		expected,
		'string formatting returns the right values'
	);
});
/*
 * So, I finally found out about an off-by-one error in my calculations that ONLY affects the LAST day of each
 * erisian month. Long story short, what I thought was an issue only on the last day of the YEAR was actually
 * caused by inconsistent indexing (some values starting at 0, some at 1) and caused the last day of ANY month
 * to be converted to "day 00 of <next month>" instead. Of course, after that, the rest of the month was fine.
 * I only even noticed (because I'd initially thought it only a problem on December 31) when my own terminal's
 * status line read "PP 00 Bcy" on August 07 (GRE) at which point I finally realised that my math was fuckier
 * than I thought, removed the monkeypatch for December 31, and tracked down and fixed the actual problem.
 *
 * This set of tests is how I did that. It was the proof that the first day of the month and the day BEFORE the
 * last day of the month acted fine that lead me to the actual issue in the calculations - namely, that JS Date
 * objects are brain-dead and apparently I wasn't much better. The internal Date objects return some values that
 * start at 0 (like the month) and some that start at 1 (like the day of the month) and, for some reason, I didn't
 * actually correct that to all be zero-indexed. I just slapped `- 1` in my calculations, but I missed some places.
 */
tap.test('fenceposts', async t => {
	const mar13 = new DDate('2020-03-13T11:11:11.111Z'); // one (1)
	const mar14 = new DDate('2020-03-14T11:11:11.111Z');
	const mar15 = new DDate('2020-03-15T11:11:11.111Z');
	const aug06 = new DDate('2020-08-06T11:11:11.111Z');
	const aug07 = new DDate('2020-08-07T11:11:11.111Z');
	const aug08 = new DDate('2020-08-08T11:11:11.111Z');
	const format = "[%u:%A] [%m:%B] [%d]";
	t.is(
		mar13.format(format),
		"[2:Boomtime] [1:Chaos] [72]",
		"March 13 is Boomtime 72 Chaos"
	);
	t.is(
		mar14.format(format),
		"[3:Pungenday] [1:Chaos] [73]",
		"March 14 is Pungenday 73 Chaos"
	);
	t.is(
		mar15.format(format),
		"[4:Prickle-Prickle] [2:Discord] [01]",
		"March 15 is Prickle-Prickle 01 Discord"
	);
	t.is(
		aug06.format(format),
		"[3:Pungenday] [3:Confusion] [72]",
		"August 06 is Prickle-Prickle 72 Confusion"
	);
	t.is(
		aug07.format(format),
		"[4:Prickle-Prickle] [3:Confusion] [73]",
		"August 07 is Prickle-Prickle 73 Confusion"
	);
	t.is(
		aug08.format(format),
		"[5:Setting Orange] [4:Bureaucracy] [01]",
		"August 08 is Setting Orange 01 Bureaucracy"
	);
});

