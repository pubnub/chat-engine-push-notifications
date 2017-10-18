require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |spec|
  spec.name     = "CENNotifications"
  spec.version  = package['version']
  spec.summary  = package["description"]
  spec.homepage = 'https://github.com/pubnub/chat-engine-push-notifications'

  spec.authors = {
    'Serhii Mamontov' => 'sergey@pubnub.com',
    'PubNub, Inc.'    => 'support@pubnub.com'
  }
  spec.social_media_url = 'https://twitter.com/pubnub'

  spec.source = {
    :git => 'https://github.com/pubnub/chat-engine-push-notifications.git',
    :tag => "v#{spec.version}"
  }

  spec.ios.deployment_target = '8.0'
  spec.requires_arc = true

  spec.preserve_paths = "package.json", "LICENSE"
  spec.source_files = "Libraries/*IOS/**/*.{h,m}"
  spec.header_dir   = "CENNotifications"

  spec.license = { 
      :type => package["license"], 
      :text => <<-LICENSE
          Copyright (c) 2017 PubNub

          Permission is hereby granted, free of charge, to any person obtaining a copy
          of this software and associated documentation files (the "Software"), to deal
          in the Software without restriction, including without limitation the rights
          to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions:

          The above copyright notice and this permission notice shall be included in all
          copies or substantial portions of the Software.

          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
          AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
          LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
          OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
          SOFTWARE.
      LICENSE
  }
end
