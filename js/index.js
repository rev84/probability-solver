// Generated by CoffeeScript 2.5.1
var bernoulli, bernoulli_init, bernoulli_normal, bernoulli_start, bernoulli_std, cdf, decode_bernoulli, encode_bernoulli, format_log_fixed, fraction_html, get_value, progress_bar_html, switch_bernoulli, switch_mode, toJPUnit, tweet, tweet_bernoulli;

$().ready(function() {
  Decimal.set({
    precision: 500
  });
  $('#switch_bernoulli').on('click', function() {
    return switch_bernoulli();
  });
  switch_mode(window.location.search.substring(1));
  return bernoulli_init();
});

switch_mode = function(arg) {
  var mode;
  [mode, arg] = arg.split('&');
  switch (mode) {
    case 'bernoulli':
      return switch_bernoulli(arg);
    default:
      return switch_bernoulli();
  }
};

decode_bernoulli = function(arg) {
  var c1, c1_fc, c1_fm, c1_p, c2, c2_f, c2_p, c3_f, c3_p, try_count;
  [c1, c1_p, c1_fm, c1_fc, try_count, c2, c2_p, c2_f, c3_p, c3_f] = arg.split('_');
  $('#bernoulli select.cond1').val(c1 === 'p' ? 'prob' : 'freq');
  $('#bernoulli select.cond2').val(c2 === 'p' ? 'prob' : 'freq');
  $('#bernoulli select.cond3.prob').val(c3_p === 'd' ? 'down' : c3_p === 'u' ? 'up' : 'just');
  $('#bernoulli select.cond3.freq').val(c3_f === 'd' ? 'down' : c3_f === 'u' ? 'up' : 'just');
  $('#bernoulli input.cond1_prob').val(c1_p);
  $('#bernoulli input.cond1_freq_mother').val(c1_fm);
  $('#bernoulli input.cond1_freq_child').val(c1_fc);
  $('#bernoulli input.try_count').val(try_count);
  $('#bernoulli input.cond2_prob').val(c2_p);
  return $('#bernoulli input.cond2_freq').val(c2_f);
};

encode_bernoulli = function() {
  var res;
  res = [];
  res.push($('#bernoulli select.cond1').val() === 'prob' ? 'p' : 'f');
  res.push($('#bernoulli input.cond1_prob').val());
  res.push($('#bernoulli input.cond1_freq_mother').val());
  res.push($('#bernoulli input.cond1_freq_child').val());
  res.push($('#bernoulli input.try_count').val());
  res.push($('#bernoulli select.cond2').val() === 'prob' ? 'p' : 'f');
  res.push($('#bernoulli input.cond2_prob').val());
  res.push($('#bernoulli input.cond2_freq').val());
  res.push($('#bernoulli select.cond3.prob').val() === 'down' ? 'd' : $('#bernoulli select.cond3.prob').val() === 'up' ? 'u' : 'j');
  res.push($('#bernoulli select.cond3.freq').val() === 'down' ? 'd' : $('#bernoulli select.cond3.freq').val() === 'up' ? 'u' : 'j');
  return res.join('_');
};

tweet_bernoulli = function() {
  return tweet('', '確率計算ツール', '?bernoulli&' + encode_bernoulli());
};

switch_bernoulli = function(arg = null) {
  $('#switch_active').html('●回以上起こる確率');
  $('.all_mode').addClass('no_display');
  if (arg && (arg.match(/_/g) || []).length >= 9) {
    decode_bernoulli(arg);
    bernoulli_start();
  }
  $('#bernoulli').removeClass('no_display');
  return history.pushState(null, '●回以上起こる確率', '?bernoulli');
};

bernoulli_init = function() {
  var bernoulli_cond1, bernoulli_cond2;
  bernoulli_cond1 = function() {
    $('#bernoulli span.cond1').addClass('no_display');
    return $('#bernoulli .cond1.' + $(this).val()).removeClass('no_display');
  };
  $('#bernoulli select.cond1').on('change', bernoulli_cond1);
  bernoulli_cond1.bind($('#bernoulli select.cond1').eq(0))();
  bernoulli_cond2 = function() {
    $('#bernoulli span.cond2').addClass('no_display');
    return $('#bernoulli .cond2.' + $(this).val()).removeClass('no_display');
  };
  $('#bernoulli select.cond2').on('change', bernoulli_cond2);
  bernoulli_cond2.bind($('#bernoulli select.cond2').eq(0))();
  $('#bernoulli .start').on('click', bernoulli_start);
  return $('#bernoulli .tweet').on('click', tweet_bernoulli);
};

bernoulli_start = function() {
  var bernoulli_value, is_std, mode, n, p, res, x;
  bernoulli_value = function(class_name) {
    return get_value('bernoulli', class_name);
  };
  p = (function() {
    switch ($('#bernoulli select.cond1').val()) {
      case 'prob':
        return bernoulli_value('cond1_prob').div(100);
      case 'freq':
        return bernoulli_value('cond1_freq_child').div(bernoulli_value('cond1_freq_mother'));
    }
  })();
  n = bernoulli_value('try_count');
  x = (function() {
    switch ($('#bernoulli select.cond2').val()) {
      case 'prob':
        return n.mul(bernoulli_value('cond2_prob').div(100));
      case 'freq':
        return bernoulli_value('cond2_freq');
    }
  })();
  mode = (function() {
    switch ($('#bernoulli select.cond2').val()) {
      case 'prob':
        return $('#bernoulli .cond3.prob').eq(0).val();
      case 'freq':
        return $('#bernoulli .cond3.freq').eq(0).val();
    }
  })();
  [res, is_std] = bernoulli(p, n, x, mode);
  $('#bernoulli .progress-bar').css('width', '' + res.mul(100).ceil().toFixed() + '%');
  $('#bernoulli .result').html('' + format_log_fixed(res.mul(100).toFixed()) + '％');
  $('#bernoulli .fraction').html('').append(fraction_html(1, Decimal(1).div(res).lessThan(1000) ? Decimal(1).div(res).toFixed(1) : toJPUnit(Decimal(1).div(res).toFixed(0))));
  return $('#bernoulli .method').html(is_std ? '(正規分布近似)' : '(総当り)');
};

bernoulli = function(p, n, x, mode) {
  if (mode === 'just') {
    return [bernoulli_normal(p, n, x, mode), false];
  // 正規分布近似
  } else if (n.mul(p).greaterThan(5) && n.mul(Decimal(1).minus(p)).greaterThan(5)) {
    return [bernoulli_std(p, n, x, mode), true];
  } else {
    return [bernoulli_normal(p, n, x, mode), false];
  }
};

bernoulli_std = function(p, n, x, mode) {
  var avg, std;
  avg = n.mul(p); // 平均
  std = avg.mul(Decimal(1).sub(p)).sqrt(); // 標準偏差
  x = x.add(0.5);
  if (mode === 'up') {
    return cdf(x.sub(avg).div(std));
  } else {
    return Decimal(1).sub(cdf(x.sub(avg).div(std)));
  }
};

bernoulli_normal = function(p, n, x, mode) {
  var ary, c, i, is_reverse, j, len, sum;
  if (mode === 'down' && x.equals(n)) {
    return Decimal(1);
  }
  if (mode === 'up' && x.equals(0)) {
    return Decimal(0);
  }
  if (!x.equals(x.floor())) {
    x = mode === 'up' ? x.ceil() : x.floor();
  }
  sum = Decimal(0);
  is_reverse = false;
  ary = (function() {
    var ref, ref1, ref2, ref3, ref4, ref5;
    switch (mode) {
      case 'up':
        if (x.lessThan(n.div(2))) {
          is_reverse = true;
          return (function() {
            var results = [];
            for (var j = 0, ref = x.toNumber(); 0 <= ref ? j < ref : j > ref; 0 <= ref ? j++ : j--){ results.push(j); }
            return results;
          }).apply(this);
        } else {
          return (function() {
            var results = [];
            for (var j = ref1 = x.toNumber(), ref2 = n.toNumber(); ref1 <= ref2 ? j <= ref2 : j >= ref2; ref1 <= ref2 ? j++ : j--){ results.push(j); }
            return results;
          }).apply(this);
        }
        break;
      case 'down':
        if (x.lessThan(n.div(2))) {
          return (function() {
            var results = [];
            for (var j = 0, ref3 = x.toNumber(); 0 <= ref3 ? j <= ref3 : j >= ref3; 0 <= ref3 ? j++ : j--){ results.push(j); }
            return results;
          }).apply(this);
        } else {
          is_reverse = true;
          return (function() {
            var results = [];
            for (var j = ref4 = x.toNumber() + 1, ref5 = n.toNumber(); ref4 <= ref5 ? j <= ref5 : j >= ref5; ref4 <= ref5 ? j++ : j--){ results.push(j); }
            return results;
          }).apply(this);
        }
        break;
      case 'just':
        return [x.toNumber()];
    }
  })();
  for (j = 0, len = ary.length; j < len; j++) {
    i = ary[j];
    c = math.combinations(n.toNumber(), i);
    sum = sum.add(p.pow(i).mul(Decimal(1).sub(p).pow(n.sub(i))).mul(c));
  }
  if (is_reverse) {
    return Decimal(1).sub(sum);
  } else {
    return sum;
  }
};

cdf = function(x) {
  var Z, b1, b2, b3, b4, b5, p, t, y;
  // constants
  p = Decimal(0.2316419);
  b1 = Decimal(0.31938153);
  b2 = Decimal(-0.356563782);
  b3 = Decimal(1.781477937);
  b4 = Decimal(-1.821255978);
  b5 = Decimal(1.330274429);
  t = Decimal(1).div(Decimal(1).add(p.mul(x.abs())));
  Z = Decimal(Math.E).pow(x.mul(-1).mul(x).div(2)).div(Decimal(2).mul(Math.PI).sqrt());
  y = Decimal(1).minus(Z.mul(b5.mul(t).add(b4).mul(t).add(b3).mul(t).add(b2).mul(t).add(b1).mul(t)));
  if (x.greaterThan(0)) {
    return Decimal(1).minus(y);
  } else {
    return y;
  }
};

get_value = function(module_name, class_name, is_number = true) {
  var res;
  res = $('#' + module_name + ' .' + class_name).eq(0).val();
  if (is_number) {
    return Decimal(Number(res));
  } else {
    return res;
  }
};

toJPUnit = function(num) {
  var count, i, kName, n, ptr, str;
  if (num === "Infinity") {
    return '∞';
  }
  str = new String(num);
  n = '';
  count = 0;
  ptr = 0;
  kName = ['万', '億', '兆', '京', '垓', '杼', '穰', '溝', '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数'];
  i = str.length - 1;
  while (i >= 0) {
    n = str.charAt(i) + n;
    count++;
    if (count % 4 === 0 && i !== 0) {
      n = (kName[ptr++] || '') + n;
    }
    i--;
  }
  return n;
};

fraction_html = function(child, mother) {
  return $('<span>').addClass('fraction_number').append($('<span>').addClass('fraction_child').html(child)).append($('<span>').addClass('fraction_mother').html(mother));
};

format_log_fixed = function(str) {
  var cnt, j, len, res, s, strs;
  str = new String(str);
  strs = str.split('');
  res = '';
  cnt = 0;
  for (j = 0, len = strs.length; j < len; j++) {
    s = strs[j];
    res += s;
    if (s !== '0' && s !== '.') {
      cnt++;
    }
    if (cnt >= 3) {
      break;
    }
  }
  return res;
};

progress_bar_html = function(value) {
  return $('<div>').addClass('progress-bar progress-bar-striped progress-bar-animated').attr({
    role: 'progressbar',
    ariaValuenow: value,
    ariaValuemin: '0',
    ariaValuemax: '100'
  });
};

tweet = function(content, hashTag = null, url = null, w = 575, h = 400) {
  var accessUrl, text;
  text = encodeURIComponent(content + (hashTag === null ? '' : ' #' + hashTag));
  if (url === null) {
    url = encodeURIComponent(location.href);
  } else {
    url = encodeURIComponent(location.protocol + '//' + location.host + location.pathname + url);
  }
  accessUrl = 'https://twitter.com/share?url=' + url + '&text=' + text;
  w = window.open(accessUrl, '', 'scrollbars=yes,Width=' + w + ',Height=' + h);
  return w.focus();
};
