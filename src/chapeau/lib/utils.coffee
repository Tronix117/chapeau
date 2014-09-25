'use strict'

_ = require 'underscore'

# Utilities
# ---------

utils =
  # Object Helpers
  # --------------

  functionName: (f)->
    ret = f.toString().substr 9 #'function '.length
    ret.substr 0, ret.indexOf '('

  className: (c)->
    ret = c.constructor.toString().substr 9 #'function '.length
    ret.substr 0, ret.indexOf '('

  _pluralRules: [
    ['m[ae]n$', 'men']
    ['(eau)x?$', '$1x']
    ['(child)(?:ren)?$', '$1ren']
    ['(pe)(?:rson|ople)$', '$1ople']
    ['^(m|l)(?:ice|ouse)$', '$1ice']
    ['(matr|cod|mur|sil|vert|ind)(?:ix|ex)$', '$1ices']
    ['(x|ch|ss|sh|zz)$', '$1es']
    ['([^ch][ieo][ln])ey$', '$1ies']
    ['([^aeiouy]|qu)y$', '$1ies']
    ['(?:([^f])fe|(ar|l|[eo][ao])f)$', '$1$2ves']
    ['sis$', 'ses']
    ['^(apheli|hyperbat|periheli|asyndet|noumen)(?:a|on)$', '$1a']
    ['^(phenomen|criteri|organ|prolegomen|\w+hedr)(?:a|on)$', '$1a']
    ['^(agend|addend|millenni|ov|dat|extrem|bacteri|desiderat)(?:a|um)$', '$1a']
    ['^(strat|candelabr|errat|symposi|curricul|automat|quor)(?:a|um)$', '$1a']
    ['(her|at|gr)o$', '$1oes']
    ['^(alumn|alg|vertebr)(?:a|ae)$', '$1ae']
    ['(alumn|syllab|octop|vir|radi|nucle|fung|cact)(?:us|i)$', '$1i']
    ['(stimul|termin|bacill|foc|uter|loc)(?:us|i)$', '$1i']
    ['([^l]ias|[aeiou]las|[emjzr]as|[iu]am)$', '$1']
    ['([^l]ias|[aeiou]las|[emjzr]as|[iu]am)$', '$1']
    ['(e[mn]u)s?$', '$1s']
    ['(alias|[^aou]us|tlas|gas|ris)$', '$1es']
    ['^(ax|test)is$', '$1es']
    ['([^aeiou]ese)$', '$1']
    ['s?$', 's']
  ]

  pluralize: (s)->
    for v in @_pluralRules
      continue unless (r = new RegExp v[0]).test s
      return s.replace r, v[1]
    s

# Finish
# ------

# Seal the utils object.
Object.seal? utils

# Return our creation.
module.exports = utils