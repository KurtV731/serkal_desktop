# SerKal Desktop 1.2.5

Calendar updates continue to include only changed series and seasons, skipping events that already match. Large updates now take short breaks after every 20 successful writes. Temporary Google request limits trigger longer automatic retries, with a visible countdown. Calendar processing has its own bounded time allowance so that a large update is not cut short by the previous overall 45-second limit.

Completed calendar work is retained. If processing cannot finish, the next attempt reconciles the remaining work without uploading an unchanged archive again. Archive format 38 stays compatible with the current Android release.

Thanks to VelcroFist for reporting the large-update behaviour in the older desktop test version.

Source tests pass; Windows installer and live-calendar acceptance remain pending. This document does not announce public availability.
