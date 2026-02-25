$(document).ready(function() {
    const $items = $('.anagram-box');

    $items.each(function() {
        const $container = $(this);
        const startText = $container.text();
        const finalText = $container.data('final');

        // 1. Prepare the container
        // We set a fixed height/width based on current state so it doesn't collapse
        $container.css({
            height: $container.height(),
            width: $container.width()
        });

        // 2. Split text into spans
        $container.empty();
        // We use spread syntax to handle emojis/complex chars if ever needed
        [...startText].forEach(char => {
            // We use 'pre' in CSS, so a space is just a space, no &nbsp; needed
            $container.append(`<span class="char-unit" data-char="${char.toLowerCase()}">${char}</span>`);
        });

        // 3. Wait 2 seconds, then trigger shuffle
        setTimeout(() => {
            shuffleToTarget($container, finalText);
        }, 2000);
    });

    function shuffleToTarget($container, targetText) {
        const $chars = $container.find('.char-unit');

        // --- STEP A: Lock Start Positions ---
        // We calculate position relative to the CONTAINER, not the page.
        // This fixes the centering issue.
        let startPositions = [];
        const containerOffset = $container.offset();

        $chars.each(function() {
            const $char = $(this);
            const offset = $char.offset(); // Global position

            // Calculate relative 'top' and 'left'
            startPositions.push({
                top: offset.top - containerOffset.top,
                left: offset.left - containerOffset.left,
                width: $char.width() // Capture exact width
            });
        });

        // Apply absolute positioning using the calculated relative coordinates
        $chars.each(function(i) {
            $(this).css({
                position: 'absolute',
                top: startPositions[i].top,
                left: startPositions[i].left,
                width: startPositions[i].width,
                margin: 0 // Reset margins to avoid compounding offsets
            });
        });

        // --- STEP B: Map Destinations ---
        // Create an invisible dummy to find where the letters SHOULD go.
        // We apply 'anagram-dummy' class which forces width: 100% and text-align: inherit
        let $dummy = $('<div>')
            .addClass('anagram-dummy')
            .css({
                fontFamily: $container.css('font-family'),
                fontSize: $container.css('font-size'),
                fontWeight: $container.css('font-weight'),
                letterSpacing: $container.css('letter-spacing'),
                textTransform: $container.css('text-transform'),
                lineHeight: $container.css('line-height')
            })
            .appendTo($container);

        // Populate dummy
        [...targetText].forEach(char => {
            $dummy.append(`<span class="dummy-char">${char}</span>`);
        });

        // Calculate destination coordinates (Relative to Container)
        let destinations = {};

        // We must refresh container offset in case of minor shifts
        const currentContainerOffset = $container.offset();

        $dummy.find('span').each(function(index) {
            const char = targetText[index].toLowerCase();
            const offset = $(this).offset();

            if (!destinations[char]) destinations[char] = [];

            destinations[char].push({
                top: offset.top - currentContainerOffset.top,
                left: offset.left - currentContainerOffset.left
            });
        });

        // --- STEP C: Animate ---
        // We create a promise to know when ALL animations are done
        let animations = [];

        $chars.each(function() {
            const $char = $(this);
            const charKey = $char.attr('data-char');

            // If we have a destination slot for this letter
            if (destinations[charKey] && destinations[charKey].length > 0) {
                const newPos = destinations[charKey].shift();

                // Create a deferred object for this animation
                const def = $.Deferred();
                animations.push(def);

                $char.animate({
                    top: newPos.top,
                    left: newPos.left
                }, {
                    duration: 2500,
                    easing: 'linear', // You can change this to 'linear' or custom bezier if using jQuery UI
                    complete: function() {
                        def.resolve();
                    }
                });
            } else {
                // If extra letter (no home), fade it out
                $char.animate({ opacity: 0 }, 1000);
            }
        });

        // --- STEP D: Final Cleanup ---
        // When all letters have landed...
        $.when.apply($, animations).then(function() {
            // 1. Remove Dummy
            $dummy.remove();

            // 2. Hard swap the DOM to the final clean text.
            // This fixes any sub-pixel alignment issues instantly.
            $container.html(targetText);

            // 3. Reset CSS properties that we forced earlier
            $container.css({
                height: '',
                width: ''
            });
        });
    }

    // 1. Handle Link Clicks
    $('.link-item').on('click', function(e) {
        e.preventDefault();
        const targetID = $(this).data('target');
        const contentHTML = $('#' + targetID).html();

        // Smooth transition
        $('#menu-view').css('opacity', '0');
        setTimeout(() => {
            $('#menu-view').hide();
            $('#dynamic-content-area').html(contentHTML);
            $('#detail-view').show().css('opacity', '1');

            // Scroll to top of card in case they were scrolled down
            $('.card-container').animate({ scrollTop: 0 }, 300);
        }, 200);
    });

    // 2. Handle Back Button
    $('#back-btn').on('click', function() {
        $('#detail-view').css('opacity', '0');
        setTimeout(() => {
            $('#detail-view').hide();
            $('#dynamic-content-area').empty();
            $('#menu-view').show().css('opacity', '1');
        }, 200);
    });
});
