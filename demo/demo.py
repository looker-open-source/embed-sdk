#!/bin/env python

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

import os
import sys
sys.path.append('./server_utils')
from auth_utils import User, create_signed_url

from http.server import HTTPServer, BaseHTTPRequestHandler
from six.moves.urllib.parse import urlparse, parse_qs

import json

#
# Read in demo user configuration file
#

with open("./demo/demo_user.json", 'r') as f:
  data = json.load(f)

user = User(**data)

#
# Environment helper routines
#

env = {}
with open ("./.env", 'r') as f:
  for line in f:
    l = line.strip()
    if l and not l.startswith('#'):
      key_value = l.split('=', 1)
      key = key_value[0].strip()
      value = key_value[1].strip().strip('"')
      env[key] = value

def get_env(key, default=""):
  return env.get(key) or os.getenv(key) or default

#
# Retrieve Looker host and secret from environment or .env
#

HOST = get_env("LOOKER_EMBED_HOST")
SECRET = get_env("LOOKER_EMBED_SECRET")

DEMO_HOST = get_env("LOOKER_DEMO_HOST", 'localhost')
DEMO_PORT = int(get_env("LOOKER_DEMO_PORT", '8080'))

#
# Very simple demo web server
#

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):

  # Helper to return a the demo web site files

  def do_file(self, filename):
    if filename == "/":
      filename = "/index.html"
    path = "./demo/%s" % filename

    try:
      with open(path, 'rb') as f:
        self.send_response(200)
        self.end_headers()
        self.wfile.write(f.read())
    except IOError:
      self.send_response(404)
      self.end_headers()

  def do_auth(self, src):
    # Combine 'src' from query with demo user configuration, host and secret to create signed url
    # Any session validation should happen here.
    url = create_signed_url(src, user, HOST, SECRET)

    # Return signed url as json blob {"url":"<signed_url>"}
    self.send_response(200)
    self.end_headers()
    self.wfile.write(json.dumps({
      'url': url
    }).encode())

  # Override simple GET callback

  def do_GET(self):
    parts = urlparse(self.path)
    query = parse_qs(parts.query)

    if parts.path == '/auth':
      self.do_auth(query['src'][0])
    else:
      self.do_file(parts.path)


httpd = HTTPServer((DEMO_HOST, DEMO_PORT), SimpleHTTPRequestHandler)
print('Server listening on %s:%s' % (DEMO_HOST, DEMO_PORT))
httpd.serve_forever()
