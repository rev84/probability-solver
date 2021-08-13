$().ready ->
  Decimal.set {
    precision: 500
  }
  $('#switch_bernoulli').on 'click', ->
    switch_bernoulli()
  switch_mode(window.location.search.substring(1))
  bernoulli_init()


switch_mode = (arg)->
  [mode, arg] = arg.split('&')
  switch mode
    when 'bernoulli'
      switch_bernoulli(arg)
    else
      switch_bernoulli()
  

decode_bernoulli = (arg)->
  [c1, c1_p, c1_fm, c1_fc, try_count, c2, c2_p, c2_f, c3_p, c3_f] = arg.split('_')
  $('#bernoulli select.cond1').val(if c1 is 'p' then 'prob' else 'freq')
  $('#bernoulli select.cond2').val(if c2 is 'p' then 'prob' else 'freq')
  $('#bernoulli select.cond3.prob').val(if c3_p is 'd' then 'down' else if c3_p is 'u' then 'up' else 'just')
  $('#bernoulli select.cond3.freq').val(if c3_f is 'd' then 'down' else if c3_f is 'u' then 'up' else 'just')
  $('#bernoulli input.cond1_prob').val(c1_p)
  $('#bernoulli input.cond1_freq_mother').val(c1_fm)
  $('#bernoulli input.cond1_freq_child').val(c1_fc)
  $('#bernoulli input.try_count').val(try_count)
  $('#bernoulli input.cond2_prob').val(c2_p)
  $('#bernoulli input.cond2_freq').val(c2_f)

encode_bernoulli = ->
  res = []
  res.push if $('#bernoulli select.cond1').val() is 'prob' then 'p' else 'f'
  res.push $('#bernoulli input.cond1_prob').val()
  res.push $('#bernoulli input.cond1_freq_mother').val()
  res.push $('#bernoulli input.cond1_freq_child').val()
  res.push $('#bernoulli input.try_count').val()
  res.push if $('#bernoulli select.cond2').val() is 'prob' then 'p' else 'f'
  res.push $('#bernoulli input.cond2_prob').val()
  res.push $('#bernoulli input.cond2_freq').val()
  res.push if $('#bernoulli select.cond3.prob').val() is 'down' then 'd' else if $('#bernoulli select.cond3.prob').val() is 'up' then 'u' else 'j'
  res.push if $('#bernoulli select.cond3.freq').val() is 'down' then 'd' else if $('#bernoulli select.cond3.freq').val() is 'up' then 'u' else 'j'
  res.join('_')

tweet_bernoulli = ->
  tweet '', '確率計算ツール', '?bernoulli&'+encode_bernoulli()

switch_bernoulli = (arg = null)->
  $('#switch_active').html('●回以上起こる確率')
  $('.all_mode').addClass('no_display')
  if arg and (arg.match(/_/g) || [] ).length >= 9
    decode_bernoulli(arg)
    bernoulli_start()

  $('#bernoulli').removeClass('no_display')
  history.pushState(null, '●回以上起こる確率', '?bernoulli')

bernoulli_init = ->
  bernoulli_cond1 = ->
    $('#bernoulli span.cond1').addClass('no_display')
    $('#bernoulli .cond1.'+$(@).val()).removeClass('no_display')
  $('#bernoulli select.cond1').on 'change', bernoulli_cond1
  bernoulli_cond1.bind($('#bernoulli select.cond1').eq(0))()

  bernoulli_cond2 = ->
    $('#bernoulli span.cond2').addClass('no_display')
    $('#bernoulli .cond2.'+$(@).val()).removeClass('no_display')
  $('#bernoulli select.cond2').on 'change', bernoulli_cond2
  bernoulli_cond2.bind($('#bernoulli select.cond2').eq(0))()

  $('#bernoulli .start').on 'click', bernoulli_start
  $('#bernoulli .tweet').on 'click', tweet_bernoulli

bernoulli_start = ->
  bernoulli_value = (class_name) ->
    get_value('bernoulli', class_name)

  p = switch $('#bernoulli select.cond1').val()
    when 'prob' then bernoulli_value('cond1_prob').div(100)
    when 'freq' then bernoulli_value('cond1_freq_child').div(bernoulli_value('cond1_freq_mother'))
  n = bernoulli_value('try_count')
  
  x = switch $('#bernoulli select.cond2').val()
    when 'prob'
      n.mul(bernoulli_value('cond2_prob').div(100))
    when 'freq'
      bernoulli_value('cond2_freq')
  mode = switch $('#bernoulli select.cond2').val()
    when 'prob'
      $('#bernoulli .cond3.prob').eq(0).val()
    when 'freq'
      $('#bernoulli .cond3.freq').eq(0).val()

  [res, is_std] = bernoulli(p, n, x, mode)
  $('#bernoulli .result').html(
    ''+format_log_fixed(res.mul(100).toFixed())+'％'
  )

  $('#bernoulli .fraction').html('').append(
    fraction_html(
      1,
      if Decimal(1).div(res).lessThan(1000)
        Decimal(1).div(res).toFixed(1)
      else
        toJPUnit(Decimal(1).div(res).toFixed(0))
    )
  )

  $('#bernoulli .method').html(
    if is_std then '(正規分布近似)' else '(総当り)'
  )

bernoulli = (p, n, x, mode)->
  if mode is 'just'
    [bernoulli_normal(p, n, x, mode), false]
  # 正規分布近似
  else if n.mul(p).greaterThan(5) and n.mul(Decimal(1).minus(p)).greaterThan(5)
    [bernoulli_std(p, n, x, mode), true]
  else
    [bernoulli_normal(p, n, x, mode), false]

bernoulli_std = (p, n, x, mode)->
  avg = n.mul(p) # 平均
  std = avg.mul(Decimal(1).sub(p)).sqrt() # 標準偏差

  x = x.add(0.5)
  if mode is 'up'
    cdf(x.sub(avg).div(std))
  else
    Decimal(1).sub cdf(x.sub(avg).div(std))

bernoulli_normal = (p, n, x, mode)->
  return Decimal(1) if mode is 'down' and x.equals(n)
  return Decimal(0) if mode is 'up' and x.equals(0)

  unless x.equals(x.floor())
    x = if mode is 'up'
        x.ceil()
      else
        x.floor()

  sum = Decimal(0)
  is_reverse = false
  ary = switch mode
    when 'up'
      if x.lessThan(n.div(2))
        is_reverse = true
        [0...x.toNumber()]
      else
        [x.toNumber()..n.toNumber()]
    when 'down'
      if x.lessThan(n.div(2))
        [0..x.toNumber()]
      else
        is_reverse = true
        [x.toNumber()+1..n.toNumber()]
    when 'just' then [x.toNumber()]
    
  for i in ary
    c = math.combinations(n.toNumber(), i)
    sum = sum.add p.pow(i).mul(Decimal(1).sub(p).pow(n.sub(i))).mul(c)
  if is_reverse then Decimal(1).sub(sum) else sum

cdf = (x) ->
  # constants
  p = Decimal(0.2316419)
  b1 = Decimal(0.31938153)
  b2 = Decimal(-0.356563782)
  b3 = Decimal(1.781477937)
  b4 = Decimal(-1.821255978)
  b5 = Decimal(1.330274429)
  t = Decimal(1).div(Decimal(1).add(p.mul(x.abs())))
  Z = Decimal(Math.E).pow(
    x.mul(-1).mul(x).div(2)
  ).div(
    Decimal(2).mul(Math.PI).sqrt()
  )
  y = Decimal(1).minus(
    Z.mul(
      b5.mul(t).add(b4).mul(t).add(b3).mul(t).add(b2).mul(t).add(b1).mul(t)
    )
  )
  if x.greaterThan(0) then Decimal(1).minus(y) else y

get_value = (module_name, class_name, is_number = true) ->
  res = $('#'+module_name+' .'+class_name).eq(0).val()
  if is_number then Decimal(Number(res)) else res

toJPUnit = (num) ->
  return '∞' if num is "Infinity"
  str = new String(num)
  n = ''
  count = 0
  ptr = 0
  kName = [
    '万'
    '億'
    '兆'
    '京'
    '垓'
    '杼'
    '穰'
    '溝'
    '澗'
    '正'
    '載'
    '極'
    '恒河沙'
    '阿僧祇'
    '那由他'
    '不可思議'
    '無量大数'
  ]
  i = str.length - 1
  while i >= 0
    n = str.charAt(i) + n
    count++
    if count % 4 == 0 and i != 0
      n = (kName[ptr++] or '') + n
    i--
  n

fraction_html = (child, mother)->
  $('<span>').addClass('fraction_number').append(
    $('<span>').addClass('fraction_child').html(child)
  ).append(
    $('<span>').addClass('fraction_mother').html(mother)
  )

format_log_fixed = (str)->
  str = new String(str)
  strs = str.split('')
  res = ''
  cnt = 0
  for s in strs
    res += s
    cnt++ if s isnt '0' and s isnt '.'
    break if cnt >= 3
  res

tweet = (content, hashTag = null, url = null, w = 575, h = 400)->
  text = encodeURIComponent content+(if hashTag is null then '' else ' #'+hashTag)
  if url is null
    url = encodeURIComponent location.href
  else
    url = encodeURIComponent location.protocol+'//'+location.host+location.pathname+url
  accessUrl = 'https://twitter.com/share?url='+url+'&text='+text
  w = window.open(accessUrl, '', 'scrollbars=yes,Width='+w+',Height='+h)
  w.focus()