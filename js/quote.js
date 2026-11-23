// Prepare the enquiry locally and let the visitor send it in WhatsApp.
const quoteForm = document.querySelector('[data-whatsapp-form]');
if (quoteForm) {
  quoteForm.hidden = false;
  const query = new URLSearchParams(location.search);
  const event = quoteForm.elements.namedItem('event');
  const requestedEvent = query.get('event');
  if ([...event.options].some(option => option.value === requestedEvent)) {
    event.value = requestedEvent;
  }
  const requestedPackage = query.get('package')?.trim().slice(0, 110);
  if (requestedPackage) {
    quoteForm.elements.namedItem('package').value = requestedPackage;
    const notice = document.createElement('p');
    notice.className = 'notice';
    notice.textContent = 'Package enquiry · ' + requestedPackage;
    quoteForm.prepend(notice);
  }

  const fields = [
    ['name','Name'], ['phone','WhatsApp number'], ['email','Email'],
    ['event','Event type'], ['date','Event date'], ['location','Event location'],
    ['budget','Estimated budget (AED)'], ['package','Package'], ['requirements','Requirements']
  ];
  quoteForm.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(quoteForm);
    const lines = fields.flatMap(([name,label]) => {
      const value = values.get(name)?.trim();
      return value ? [label + ': ' + value] : [];
    });
    const message = ['Hello Eventistry, I’d like to request an event decoration quotation.', '', ...lines].join('\n');
    location.assign('https://wa.me/' + quoteForm.dataset.recipient + '?text=' + encodeURIComponent(message));
  });
}
