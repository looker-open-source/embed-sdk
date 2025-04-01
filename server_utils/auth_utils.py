# The MIT License (MIT)
#
# Copyright (c) 2019 Looker Data Sciences, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

import urllib
import base64
import json
import time
import binascii
import os
from hashlib import sha1
import six
import six.moves.urllib as urllib
import hmac

def to_ascii(s):
  """Compatibility function for converting between Python 2.7 and 3 calls"""
  if isinstance(s, six.text_type):
    return s
  elif isinstance(s, six.binary_type):
    return "".join(map(chr, map(ord, s.decode(encoding='UTF-8'))))
  return s

class Looker:
  def __init__(self, host, secret):
    self.secret = secret
    self.host = host

class User:
  def __init__(self, external_user_id=id, first_name=None, last_name=None,
               permissions=[], models=[], group_ids=[], external_group_id=None,
               user_attributes={}, access_filters={}, force_logout_login=True, session_length=3000):
    self.external_user_id = json.dumps(external_user_id)
    self.first_name = json.dumps(first_name)
    self.last_name = json.dumps(last_name)
    self.permissions = json.dumps(permissions)
    self.models = json.dumps(models)
    self.access_filters = json.dumps(access_filters)
    self.user_attributes = json.dumps(user_attributes)
    self.group_ids = json.dumps(group_ids)
    self.external_group_id = json.dumps(external_group_id)
    self.force_logout_login = json.dumps(force_logout_login)
    self.session_length = json.dumps(session_length)

class URL:
  def __init__(self, looker, user, embed_url):
    self.looker = looker
    self.user = user
    self.path = '/login/embed/' + urllib.parse.quote_plus(embed_url)

  def set_time(self):
    self.time = json.dumps(int(time.time()))

  def set_nonce(self):
    self.nonce = json.dumps(to_ascii(binascii.hexlify(os.urandom(16))))

  def sign(self):
    #  Do not change the order of these
    string_to_sign = "\n".join([self.looker.host,
                                self.path,
                                self.nonce,
                                self.time,
                                self.user.session_length,
                                self.user.external_user_id,
                                self.user.permissions,
                                self.user.models,
                                self.user.group_ids,
                                self.user.external_group_id,
                                self.user.user_attributes,
                                self.user.access_filters])

    signer = hmac.new(bytearray(self.looker.secret, 'UTF-8'), string_to_sign.encode('UTF-8'), sha1)
    self.signature = base64.b64encode(signer.digest())

  def to_string(self):
    self.set_time()
    self.set_nonce()
    self.sign()

    params = {'nonce':               self.nonce,
              'time':                self.time,
              'session_length':      self.user.session_length,
              'external_user_id':    self.user.external_user_id,
              'permissions':         self.user.permissions,
              'models':              self.user.models,
              'group_ids':           self.user.group_ids,
              'external_group_id':   self.user.external_group_id,
              'user_attributes':     self.user.user_attributes,
              'access_filters':      self.user.access_filters,
              'signature':           self.signature,
              'first_name':          self.user.first_name,
              'last_name':           self.user.last_name,
              'force_logout_login':  self.user.force_logout_login}

    query_string = '&'.join(["%s=%s" % (key, urllib.parse.quote_plus(val)) for key, val in params.items()])

    return "%s%s?%s" % (self.looker.host, self.path, query_string)

def create_signed_url(src, user, host, secret):
  looker = Looker(host, secret)

  url = URL(looker, user, src)

  return "https://" + url.to_string()
