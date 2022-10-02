(map
  "{" @start
  "}" @end
)

(list
  "[" @start
  "]" @end
)

(call
  target: (identifier) @keyword
  (do_block
    "do" @start
    "end" @end
   (#set! role function)
   (#set! scope.byLine)
  )
  (#match? @keyword "^(def|defp|defmacro|defmacrop|defn|defnp|defprotocol|defimpl)$")
)

(do_block
  "do" @start
  "end" @end
)
